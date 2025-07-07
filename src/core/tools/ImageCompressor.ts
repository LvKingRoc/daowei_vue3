import { ref, Ref } from 'vue';

interface ImageCompressorState {
  isDragging: Ref<boolean>;
  previewImage: Ref<string | null>;
  originalFile: Ref<File | null>;
  compressedImage: Ref<string | null>;
  targetSize: Ref<number>;
  sizeUnit: Ref<string>;
  originalSize: Ref<string>;
  compressedSize: Ref<string>;
  compressionRatio: Ref<number>;
  errorMessage: Ref<string | null>;
}

/**
 * 压缩选项接口
 */
export interface CompressionOptions {
  maxSizeKB?: number;      // 最大文件大小(KB)
  maxWidth?: number;       // 最大宽度
  maxHeight?: number;      // 最大高度
  quality?: number;        // 初始质量(0-1)
  minQuality?: number;     // 最低质量(0-1)
  format?: string;         // 输出格式('image/jpeg'|'image/png')
  preserveAspectRatio?: boolean; // 保持宽高比
}

/**
 * 压缩信息接口
 */
export interface CompressionInfo {
  show: boolean;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export function useImageCompressor() {
  const state: ImageCompressorState = {
    isDragging: ref(false),
    previewImage: ref(null),
    originalFile: ref(null),
    compressedImage: ref(null),
    targetSize: ref(500),
    sizeUnit: ref('KB'),
    originalSize: ref(''),
    compressedSize: ref(''),
    compressionRatio: ref(0),
    errorMessage: ref(null),
  };

  const handleDragOver = () => {
    state.isDragging.value = true;
  };

  const handleDragLeave = () => {
    state.isDragging.value = false;
  };

  const handleDrop = (e: DragEvent) => {
    state.isDragging.value = false;
    state.errorMessage.value = null;
    const file = e.dataTransfer?.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          state.errorMessage.value = validation.message || '文件验证失败';
          return;
        }
        processFile(file);
      } else {
        state.errorMessage.value = '只能上传图片文件';
      }
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    state.errorMessage.value = null;
    const file = target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        state.errorMessage.value = '只能上传图片文件';
        return;
      }
      
      const validation = validateImageFile(file);
      if (!validation.valid) {
        state.errorMessage.value = validation.message || '文件验证失败';
        return;
      }
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    state.originalFile.value = file;
    state.originalSize.value = formatSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      state.previewImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const compressImage = async () => {
    if (!state.originalFile.value) return;

    const options: CompressionOptions = {
      maxSizeKB: state.targetSize.value * (state.sizeUnit.value === 'MB' ? 1024 : 1),
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.9,
      minQuality: 0.1,
      format: 'image/jpeg',
      preserveAspectRatio: true
    };
    
    try {
      const { blob, compressionInfo } = await compressImageFile(state.originalFile.value, options);
      state.compressedImage.value = URL.createObjectURL(blob);
      state.compressedSize.value = formatSize(blob.size);
      state.compressionRatio.value = compressionInfo.ratio;
    } catch (error) {
      state.errorMessage.value = '压缩失败';
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  const downloadImage = () => {
    if (!state.compressedImage.value || !state.originalFile.value) return;

    const link = document.createElement('a');
    link.download = `compressed_${state.originalFile.value.name.split('.')[0]}.jpg`;
    link.href = state.compressedImage.value;
    link.click();
  };

  const clearImage = () => {
    state.previewImage.value = null;
    state.originalFile.value = null;
    state.compressedImage.value = null;
    state.originalSize.value = '';
    state.compressedSize.value = '';
    state.compressionRatio.value = 0;
    state.errorMessage.value = null;
  };

  return {
    ...state,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    processFile,
    compressImage,
    downloadImage,
    clearImage,
    formatSize
  };
}

/**
 * 压缩图片文件
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 包含压缩后的Blob对象和压缩信息的Promise
 */
export const compressImageFile = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<{
  blob: Blob;
  compressionInfo: CompressionInfo;
}> => {
  if (!file || !(file instanceof Blob)) {
    throw new Error('无效的文件对象');
  }
  
  const {
    maxSizeKB = 250,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.9,
    minQuality = 0.1,
    format = 'image/jpeg',
    preserveAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    // 如果文件已经小于目标大小，直接返回
    if (file.size / 1024 <= maxSizeKB) {
      resolve({
        blob: file,
        compressionInfo: {
          show: true,
          originalSize: Math.round(file.size / 1024),
          compressedSize: Math.round(file.size / 1024),
          ratio: 0
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('文件读取失败'));
        return;
      }

      const img = new Image();
      img.src = event.target.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        // 调整图片尺寸
        let { width, height } = img;
        
        if (preserveAspectRatio) {
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height);
              height = maxHeight;
            }
          }
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // 递归压缩直到达到目标大小
        let currentQuality = quality;
        const compressLoop = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            
            const blobSizeKB = blob.size / 1024;
            
            if (blobSizeKB <= maxSizeKB || currentQuality <= minQuality) {
              const compressionInfo: CompressionInfo = {
                show: true,
                originalSize: Math.round(file.size / 1024),
                compressedSize: Math.round(blobSizeKB),
                ratio: Math.round((1 - blobSizeKB / (file.size / 1024)) * 100)
              };
              
              resolve({ blob, compressionInfo });
            } else {
              currentQuality = Math.max(currentQuality - 0.1, minQuality);
              compressLoop();
            }
          }, format, currentQuality);
        };
        
        compressLoop();
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
};

/**
 * 压缩图片到指定大小 (兼容旧API)
 * @param file 原始文件
 * @param maxSizeKB 最大文件大小(KB)，默认250KB
 * @returns 包含压缩后的Blob对象和压缩信息的Promise
 */
export const compressImage = async (
  file: File | any, 
  maxSizeKB: number = 250
): Promise<{
  blob: Blob;
  compressionInfo: CompressionInfo;
}> => {
  const actualFile = file.raw || file;
  return compressImageFile(actualFile, { maxSizeKB });
};

/**
 * 将Blob转换为File对象
 * @param blob Blob对象
 * @param fileName 文件名
 * @returns File对象
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

/**
 * 验证图片文件
 * @param file 文件对象
 * @param options 验证选项
 * @returns 验证结果
 */
export const validateImageFile = (
  file: File | any,
  options: {
    maxSizeMB?: number;
  } = {}
): { valid: boolean; message?: string } => {
  if (!file) {
    return {
      valid: false,
      message: '文件对象不能为空'
    };
  }

  const actualFile = file.raw || file;
  const { maxSizeMB = 15 } = options;
  
  // 验证文件类型
  const isValidType = validateImageType(actualFile);
  if (!isValidType) {
    return { 
      valid: false, 
      message: `只能上传图片格式的文件！` 
    };
  }
  
  // 验证文件大小
  const isValidSize = actualFile.size / 1024 / 1024 < maxSizeMB;
  if (!isValidSize) {
    return { 
      valid: false, 
      message: `图片大小不能超过${maxSizeMB}MB！` 
    };
  }
  
  return { valid: true };
};

/**
 * 验证文件是否为图片类型
 * @param file 文件对象
 * @returns 是否为图片
 */
const validateImageType = (file: File): boolean => {
  if (!file.type) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'];
    return ext ? imageExts.includes(ext) : false;
  }
  return file.type.startsWith('image/');
}; 