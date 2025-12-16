// @ts-nocheck
/**
 * 图片文字识别工具
 * 通过后端代理调用百度OCR API
 */
import { ref } from 'vue';
import request from '@/core/utils/request';

/**
 * 图片文字识别组合式函数
 * @returns 图片文字识别相关状态和方法
 */
export function useImageToText() {
  const state = {

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
  const handleDrop = (e) => {
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
  const handleFileSelect = (e) => {
    const target = e.target;
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
  const processImageFile = (file) => {
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
      state.previewImage.value = e.target?.result;
    };
    reader.readAsDataURL(file);
  };

  /**
   * 将文件转换为base64
   * @param file 文件对象
   * @returns base64字符串
   */
  const fileToBase64 = (file) => {

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // 移除data:image/xxx;base64,前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * 执行图片文字识别（通过后端代理）
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
      
      // 将图片转换为base64
      const base64Image = await fileToBase64(state.originalFile.value);
      
      // 调用后端代理OCR API
      const response = await request.post('/proxy/ocr/recognize', {
        image: base64Image
      });
      
      // 处理识别结果
      if (response.success && response.data) {
        const ocrResult = response.data;
        if (ocrResult.words_result && ocrResult.words_result.length > 0) {
          const text = ocrResult.words_result.map((item) => item.words).join('\n');
          state.recognizedText.value = text;
        } else {
          state.recognizedText.value = '未识别到文字内容';
        }
      } else {
        state.errorMessage.value = response.message || '识别失败';
      }
      
    } catch (error) {
      console.error('文字识别失败:', error);
      state.errorMessage.value = error.message || '文字识别失败，请重试';
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
  file,
  options = {}
) => {

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
export async function copyToClipboard(text) {

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 复制到剪贴板失败
    return false;
  }
}