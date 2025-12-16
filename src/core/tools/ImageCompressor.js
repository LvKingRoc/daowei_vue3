// 图片压缩工具（纯 JavaScript 版本）
// 尽量保持与原有 ImageCompressor.ts 的导出接口一致：
// - DEFAULT_COMPRESSION_OPTIONS
// - SAMPLE_COMPRESSION_OPTIONS
// - DEFAULT_VALIDATION_OPTIONS
// - compressImage(file, options)
// - validateImageFile(file, options)
// - blobToFile(blob, fileName)
// - useImageCompressor()

import { ref } from 'vue';

// 默认压缩选项
export const DEFAULT_COMPRESSION_OPTIONS = {
  maxSizeKB: 500,           // 目标大小（KB）
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.95,
  minQuality: 0.1,
  format: 'image/jpeg',
  preserveAspectRatio: true
};

// 样品管理专用压缩配置
export const SAMPLE_COMPRESSION_OPTIONS = {
  maxSizeKB: 1000,
  maxWidth: 800,
  maxHeight: 800
};

// 校验图片默认配置
export const DEFAULT_VALIDATION_OPTIONS = {
  maxSizeMB: 15 // 允许图片最大 15MB
};

// 将字节数格式化为可读字符串
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 核心压缩函数
 * @param file       原始 File 或 el-upload 的 file 对象
 * @param options    压缩配置，见 DEFAULT_COMPRESSION_OPTIONS
 * @returns Promise<{ blob, compressionInfo }>
 */
export async function compressImage(file, options = {}) {
  const actualFile = file && file.raw ? file.raw : file;
  if (!actualFile || !(actualFile instanceof Blob)) {
    throw new Error('无效的文件对象');
  }

  const merged = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  const {
    maxSizeKB,
    maxWidth,
    maxHeight,
    quality,
    minQuality,
    format,
    preserveAspectRatio
  } = merged;

  const originalSizeKB = actualFile.size / 1024;

  // 如果本身就不超过目标大小，直接返回
  if (originalSizeKB <= maxSizeKB) {
    return {
      blob: actualFile,
      compressionInfo: {
        show: true,
        originalSize: Math.round(originalSizeKB),
        compressedSize: Math.round(originalSizeKB),
        ratio: 0
      }
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(actualFile);

    reader.onload = (e) => {
      const result = e && e.target ? e.target.result : null;
      if (!result) {
        reject(new Error('文件读取失败'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
          }

          let width = img.width;
          let height = img.height;

          if (preserveAspectRatio) {
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
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

          // 二分查找合适质量
          const findBestQuality = () => {
            return new Promise((resolveFind, rejectFind) => {
              // 先试 1.0 质量
              canvas.toBlob((bestBlob) => {
                if (!bestBlob) {
                  rejectFind(new Error('无法生成图片数据'));
                  return;
                }

                if (bestBlob.size / 1024 <= maxSizeKB) {
                  resolveFind(bestBlob);
                  return;
                }

                // 再试最小质量，作为下限
                canvas.toBlob((minBlob) => {
                  if (!minBlob) {
                    rejectFind(new Error('无法生成低质量图片数据'));
                    return;
                  }

                  if (minBlob.size / 1024 > maxSizeKB) {
                    // 最低质量都达不到目标，直接用它
                    resolveFind(minBlob);
                    return;
                  }

                  let low = minQuality;
                  let high = quality;
                  let best = minBlob;
                  let iterations = 7; // 足够精细

                  const step = () => {
                    if (iterations <= 0) {
                      resolveFind(best);
                      return;
                    }
                    iterations -= 1;

                    const mid = (low + high) / 2;
                    canvas.toBlob((midBlob) => {
                      if (!midBlob) {
                        resolveFind(best);
                        return;
                      }
                      const midKB = midBlob.size / 1024;
                      if (midKB <= maxSizeKB) {
                        best = midBlob;
                        low = mid; // 质量还可以再高
                      } else {
                        high = mid; // 质量过大，往低调
                      }
                      step();
                    }, format, mid);
                  };

                  step();
                }, format, minQuality);
              }, format, 1.0);
            });
          };

          findBestQuality()
            .then((finalBlob) => {
              const finalSizeKB = finalBlob.size / 1024;
              const info = {
                show: true,
                originalSize: Math.round(originalSizeKB),
                compressedSize: Math.round(finalSizeKB),
                ratio: Math.round((1 - finalSizeKB / originalSizeKB) * 100)
              };
              resolve({ blob: finalBlob, compressionInfo: info });
            })
            .catch(reject);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
  });
}

/**
 * 校验图片类型与大小
 * @param file    File 或 el-upload file
 * @param options { maxSizeMB }
 * @returns { valid, message? }
 */
export function validateImageFile(file, options = {}) {
  const actualFile = file && file.raw ? file.raw : file;
  if (!actualFile) {
    return { valid: false, message: '文件对象不能为空' };
  }

  const { maxSizeMB } = { ...DEFAULT_VALIDATION_OPTIONS, ...options };

  // 类型检查
  const isImageType = actualFile.type
    ? actualFile.type.startsWith('image/')
    : /\.(jpg|jpeg|png|gif|bmp|webp|tiff|svg)$/i.test(actualFile.name || '');

  if (!isImageType) {
    return { valid: false, message: '只能上传图片格式的文件！' };
  }

  // 大小检查
  const sizeMB = actualFile.size / 1024 / 1024;
  if (sizeMB > maxSizeMB) {
    return { valid: false, message: `图片大小不能超过 ${maxSizeMB}MB！` };
  }

  return { valid: true };
}

/**
 * Blob 转 File
 */
export function blobToFile(blob, fileName) {
  return new File([blob], fileName, { type: blob.type });
}

/**
 * 组合式函数：供组件直接使用
 */
export function useImageCompressor() {
  const isDragging = ref(false);
  const previewImage = ref(null);
  const originalFile = ref(null);
  const compressedImage = ref(null);
  const targetSize = ref(500); // 默认 500KB
  const sizeUnit = ref('KB');
  const originalSize = ref('');
  const compressedSize = ref('');
  const compressionRatio = ref(0);
  const errorMessage = ref(null);

  const clearState = () => {
    isDragging.value = false;
    previewImage.value = null;
    originalFile.value = null;
    compressedImage.value = null;
    originalSize.value = '';
    compressedSize.value = '';
    compressionRatio.value = 0;
    errorMessage.value = null;
  };

  const formatSize = (bytes) => formatBytes(bytes);

  const processFile = (file) => {
    clearState();
    const validation = validateImageFile(file);
    if (!validation.valid) {
      errorMessage.value = validation.message || '文件验证失败';
      return;
    }

    originalFile.value = file;
    originalSize.value = formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e && e.target ? e.target.result : null;
      previewImage.value = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const target = e && e.target ? e.target : null;
    const files = target && target.files ? target.files : null;
    const file = files && files[0];
    if (file) {
      processFile(file);
    }
    if (target) {
      target.value = '';
    }
  };

  const handleDragOver = () => {
    isDragging.value = true;
  };

  const handleDragLeave = () => {
    isDragging.value = false;
  };

  const handleDrop = (e) => {
    isDragging.value = false;
    const dt = e && e.dataTransfer;
    const files = dt && dt.files ? dt.files : null;
    const file = files && files[0];
    if (file) {
      processFile(file);
    }
  };

  const executeCompression = async () => {
    if (!originalFile.value) return;

    errorMessage.value = null;
    compressedImage.value = null;
    compressedSize.value = '';
    compressionRatio.value = 0;

    try {
      const maxSizeKB =
        targetSize.value * (sizeUnit.value === 'MB' ? 1024 : 1);

      const { blob, compressionInfo } = await compressImage(originalFile.value, {
        maxSizeKB
      });

      compressedImage.value = URL.createObjectURL(blob);
      compressedSize.value = formatBytes(blob.size);
      compressionRatio.value = compressionInfo.ratio;
    } catch (err) {
      errorMessage.value = err && err.message ? err.message : '压缩失败';
    }
  };

  const downloadImage = () => {
    if (!compressedImage.value || !originalFile.value) return;
    const link = document.createElement('a');
    const originalName = originalFile.value.name || 'image';
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
    link.download = `compressed_${baseName}.jpg`;
    link.href = compressedImage.value;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return {
    isDragging,
    previewImage,
    originalFile,
    compressedImage,
    targetSize,
    sizeUnit,
    originalSize,
    compressedSize,
    compressionRatio,
    errorMessage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    compressImage: executeCompression,
    downloadImage,
    clearImage: clearState,
    formatSize
  };
}
