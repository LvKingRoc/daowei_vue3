import { ref, Ref } from 'vue';
import axios from 'axios';
import { API_KEYS, EXTERNAL_APIS } from '@/config/env.ts';

// 百度云OCR配置
const AK = API_KEYS.BAIDU_OCR.AK;
const SK = API_KEYS.BAIDU_OCR.SK;

interface ImageToTextState {
  isDragging: Ref<boolean>;
  originalFile: Ref<File | null>;
  previewImage: Ref<string | null>;
  recognizedText: Ref<string>;
  isRecognizing: Ref<boolean>;
  errorMessage: Ref<string | null>;
  language: Ref<string>;
}

/**
 * 获取百度OCR访问令牌
 * @returns {Promise<string>} 访问令牌
 */
async function getAccessToken(): Promise<string> {
  try {
    // 检查本地缓存的token是否有效
    const cachedToken = localStorage.getItem('baiduOcrToken');
    const tokenExpiry = localStorage.getItem('baiduOcrTokenExpiry');
    
    if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
      return cachedToken;
    }
    
    // 如果没有有效的缓存token，获取新token
    const apiKey = 'YOUR_API_KEY'; // 替换为您的API Key
    const secretKey = 'YOUR_SECRET_KEY'; // 替换为您的Secret Key
    
    const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`);
    const data = await response.json();
    
    if (data.access_token) {
      // 缓存token，设置24小时过期
      localStorage.setItem('baiduOcrToken', data.access_token);
      localStorage.setItem('baiduOcrTokenExpiry', (new Date().getTime() + 23 * 3600 * 1000).toString());
      
      return data.access_token;
    } else {
      throw new Error('获取访问令牌失败');
    }
  } catch (error) {
    // 获取访问令牌失败
    throw new Error('无法获取OCR服务访问权限');
  }
}

/**
 * 图片文字识别组合式函数
 * @returns 图片文字识别相关状态和方法
 */
export function useImageToText() {
  const state: ImageToTextState = {
    isDragging: ref(false),
    originalFile: ref(null),
    previewImage: ref(null),
    recognizedText: ref(''),
    isRecognizing: ref(false),
    errorMessage: ref(null),
    language: ref('CHN_ENG'), // 默认中英文混合
  };

  /**
   * 处理拖拽进入
   */
  const handleDragOver = () => {
    state.isDragging.value = true;
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = () => {
    state.isDragging.value = false;
  };

  /**
   * 处理文件拖放
   * @param e 拖放事件
   */
  const handleDrop = (e: DragEvent) => {
    state.isDragging.value = false;
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    } else if (file) {
      state.errorMessage.value = '只支持图片文件';
    }
  };

  /**
   * 处理文件选择
   * @param e 文件选择事件
   */
  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    } else if (file) {
      state.errorMessage.value = '只支持图片文件';
    }
  };

  /**
   * 处理图片文件
   * @param file 图片文件
   */
  const processImageFile = (file: File) => {
    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      state.errorMessage.value = validation.message || '文件验证失败';
      return;
    }

    state.originalFile.value = file;
    state.errorMessage.value = null;
    state.recognizedText.value = '';
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      state.previewImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /**
   * 将文件转换为base64
   * @param file 文件对象
   * @returns base64字符串
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data:image/xxx;base64,前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * 执行图片文字识别
   * @param {File} file 图片文件
   * @returns {Promise<string>} 识别出的文字
   */
  const recognizeText = async () => {
    if (!state.originalFile.value || !state.previewImage.value) {
      state.errorMessage.value = '请先上传图片';
      return;
    }
    
    try {
      state.isRecognizing.value = true;
      state.errorMessage.value = null;
      state.recognizedText.value = '';
      
      // 获取访问令牌
      const accessToken = await getAccessToken();
      
      // 将图片转换为base64
      const base64Image = await fileToBase64(state.originalFile.value);
      
      // 调用百度云OCR API
      const response = await axios.post(
        `/baidu-api/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
        `image=${encodeURIComponent(base64Image)}&detect_direction=false&paragraph=false&probability=false&multidirectional_recognize=false`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );
      
      // 处理识别结果
      if (response.data.words_result && response.data.words_result.length > 0) {
        const text = response.data.words_result.map((item: any) => item.words).join('\n');
        state.recognizedText.value = text;
      } else {
        state.recognizedText.value = '未识别到文字内容';
      }
      
    } catch (error: any) {
      console.error('文字识别失败:', error);
      if (error.response?.data?.error_msg) {
        state.errorMessage.value = `识别失败: ${error.response.data.error_msg}`;
      } else {
        state.errorMessage.value = '文字识别失败，请重试';
      }
    } finally {
      state.isRecognizing.value = false;
    }
  };

  /**
   * 复制文本到剪贴板
   * @param {string} text 要复制的文本
   * @returns {Promise<boolean>} 是否复制成功
   */
  const copyText = async () => {
    if (!state.recognizedText.value) {
      state.errorMessage.value = '没有可复制的文字';
      return false;
    }
    
    try {
      await navigator.clipboard.writeText(state.recognizedText.value);
      return true;
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      state.errorMessage.value = '复制失败，请手动复制';
      return false;
    }
  };

  /**
   * 下载识别的文字为TXT文件
   */
  const downloadText = () => {
    if (!state.recognizedText.value) {
      state.errorMessage.value = '没有可下载的文字';
      return;
    }
    
    const blob = new Blob([state.recognizedText.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `OCR_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  /**
   * 清除所有数据
   */
  const clearImage = () => {
    if (state.previewImage.value) {
      URL.revokeObjectURL(state.previewImage.value);
    }
    
    state.originalFile.value = null;
    state.previewImage.value = null;
    state.recognizedText.value = '';
    state.isRecognizing.value = false;
    state.errorMessage.value = null;
  };

  return {
    ...state,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    recognizeText,
    copyText,
    downloadText,
    clearImage
  };
}

/**
 * 验证图片文件
 * @param file 文件对象
 * @returns 验证结果
 */
export const validateImageFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; message?: string } => {
  const { 
    maxSizeMB = 4, // 百度云OCR限制4MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp'] 
  } = options;
  
  // 验证文件类型
  const isValidType = allowedTypes.includes(file.type);
  if (!isValidType) {
    return { 
      valid: false, 
      message: `只能上传${allowedTypes.map(t => t.split('/')[1]).join('、')}格式的图片！` 
    };
  }
  
  // 验证文件大小
  const isValidSize = file.size / 1024 / 1024 < maxSizeMB;
  if (!isValidSize) {
    return { 
      valid: false, 
      message: `图片大小不能超过${maxSizeMB}MB！` 
    };
  }
  
  return { valid: true };
};

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 复制到剪贴板失败
    return false;
  }
}