import { ref, computed, Ref } from 'vue';
import JSZip from 'jszip';

interface FileInfo {
  name: string;
  size: number;
  isDirectory: boolean;
  entry?: any;
  file?: File;
  files?: File[];
  relativePath?: string;
}

interface ZipCompressorState {
  isDragging: Ref<boolean>;
  files: Ref<FileInfo[]>;
  zipName: Ref<string>;
  isCompressing: Ref<boolean>;
  compressedFile: Ref<Blob | null>;
  compressedSize: Ref<string>;
  totalSize: Ref<string>;
  compressionRatio: Ref<number>;
  isSelectingDirectory: Ref<boolean>;
  compressionProgress: Ref<number>;
  totalBytes: Ref<number>;
  processedBytes: Ref<number>;
  errorMessage: Ref<string | null>;
}

export function useZipCompressor() {
  const state: ZipCompressorState = {
    isDragging: ref(false),
    files: ref([]),
    zipName: ref(''),
    isCompressing: ref(false),
    compressedFile: ref(null),
    compressedSize: ref(''),
    totalSize: ref(''),
    compressionRatio: ref(0),
    isSelectingDirectory: ref(false),
    compressionProgress: ref(0),
    totalBytes: ref(0),
    processedBytes: ref(0),
    errorMessage: ref(null)
  };

  const hasFiles = computed(() => state.files.value.length > 0);
  const totalFiles = computed(() => state.files.value.length);
  const getTotalSize = computed(() => 
    state.files.value.reduce((total, file) => total + file.size, 0)
  );

  const selectFiles = (fileInputRef: Ref<HTMLInputElement | null>) => {
    state.isSelectingDirectory.value = false;
    setTimeout(() => {
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
        fileInputRef.value.click();
      }
    });
  };

  const selectDirectory = (fileInputRef: Ref<HTMLInputElement | null>) => {
    state.isSelectingDirectory.value = true;
    setTimeout(() => {
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
        fileInputRef.value.click();
      }
    });
  };

  const handleDragOver = (e: DragEvent) => {
    state.isDragging.value = true;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = () => {
    state.isDragging.value = false;
  };

  const handleDrop = async (e: DragEvent) => {
    state.isDragging.value = false;
    const items = e.dataTransfer?.items;

    if (!items) return;

    let isFirstItem = !state.zipName.value; // 用于跟踪是否是第一个项目

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;

        if (entry.isDirectory) {
          const dirSize = await calculateDirectorySize(entry);
          addFile({
            name: entry.name,
            size: dirSize,
            isDirectory: true,
            entry
          });
          if (isFirstItem) {
            state.zipName.value = entry.name;
            isFirstItem = false;
          }
        } else {
          const file = await getFileFromEntry(entry);
          addFile({
            name: file.name,
            size: file.size,
            isDirectory: false,
            file
          });
          if (isFirstItem) {
            // 获取文件名（不含扩展名）
            state.zipName.value = file.name.split('.').slice(0, -1).join('.') || file.name;
            isFirstItem = false;
          }
        }
      }
    }
  };

  const calculateDirectorySize = async (dirEntry: any): Promise<number> => {
    const entries = await getAllEntries(dirEntry);
    let totalSize = 0;

    for (const entry of entries) {
      if (!entry.isDirectory) {
        const file = await getFileFromEntry(entry);
        totalSize += file.size;
      }
    }

    return totalSize;
  };

  const getFileFromEntry = (entry: any): Promise<File> => {
    return new Promise(resolve => entry.file(resolve));
  };

  const getAllEntries = async (dirEntry: any): Promise<any[]> => {
    const entries: any[] = [];
    const readEntries = async (reader: any) => {
      const newEntries = await new Promise<any[]>(resolve => reader.readEntries(resolve));
      if (newEntries.length) {
        entries.push(...newEntries);
        await readEntries(reader);
      }
    };
    await readEntries(dirEntry.createReader());
    return entries;
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files?.length) return;

    const selectedFiles = Array.from(target.files);
    if (state.isSelectingDirectory.value) {
      const baseDir = selectedFiles[0]?.webkitRelativePath.split('/')[0];
      if (baseDir) {
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        // 创建文件副本数组
        const filesCopy = selectedFiles.map(file => {
          const blob = file.slice(0, file.size, file.type);
          return new File([blob], file.name, { type: file.type });
        });
        addFile({
          name: baseDir,
          size: totalSize,
          isDirectory: true,
          files: filesCopy
        });
        if (!state.zipName.value) {
          state.zipName.value = baseDir;
        }
      }
    } else {
      selectedFiles.forEach((file, index) => {
        // 创建文件副本
        const blob = file.slice(0, file.size, file.type);
        const fileCopy = new File([blob], file.name, { type: file.type });
        addFile({
          name: file.name,
          size: file.size,
          isDirectory: false,
          file: fileCopy
        });
        // 如果是第一个文件且还没有设置压缩包名称
        if (index === 0 && !state.zipName.value) {
          // 获取文件名（不含扩展名）
          state.zipName.value = file.name.split('.').slice(0, -1).join('.') || file.name;
        }
      });
    }
  };

  const addFile = (fileInfo: FileInfo) => {
    const existingIndex = state.files.value.findIndex(f => f.name === fileInfo.name);
    if (existingIndex !== -1) {
      state.files.value.splice(existingIndex, 1);
    }
    state.files.value.push(fileInfo);
  };

  const removeFile = (index: number) => {
    state.files.value.splice(index, 1);
    if (!state.files.value.length) {
      state.compressedFile.value = null;
      state.zipName.value = '';
    }
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) return 'fa-folder';

    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      pdf: 'fa-file-pdf',
      doc: 'fa-file-word',
      docx: 'fa-file-word',
      xls: 'fa-file-excel',
      xlsx: 'fa-file-excel',
      jpg: 'fa-file-image',
      jpeg: 'fa-file-image',
      png: 'fa-file-image',
      gif: 'fa-file-image',
      txt: 'fa-file-alt',
      zip: 'fa-file-archive',
      rar: 'fa-file-archive'
    };
    return extension && iconMap[extension] ? iconMap[extension] : 'fa-file';
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressFiles = async () => {
    if (!state.files.value.length || !state.zipName.value) return;

    try {
      state.isCompressing.value = true;
      state.compressionProgress.value = 0;
      state.processedBytes.value = 0;
      state.totalBytes.value = getTotalSize.value;
      state.errorMessage.value = null;

      const zip = new JSZip();
      const totalFiles = state.files.value.length;
      let processedFiles = 0;

      // 处理所有文件
      for (const fileInfo of state.files.value) {
        try {
          if (fileInfo.isDirectory) {
            if (fileInfo.files) {
              // 处理通过文件选择器选择的目录
              for (const file of fileInfo.files) {
                const relativePath = file.webkitRelativePath;
                await addFileToZipWithRetry(zip, file, relativePath);
              }
            } else if (fileInfo.entry) {
              // 处理通过拖放添加的目录
              await processDirectoryEntry(zip, fileInfo.entry);
            }
          } else if (fileInfo.file) {
            // 处理单个文件
            await addFileToZipWithRetry(zip, fileInfo.file, fileInfo.file.name);
          }
          
          processedFiles++;
          updateProgress(processedFiles / totalFiles * 50); // 前50%进度用于添加文件
        } catch (error) {
          console.error(`处理文件 ${fileInfo.name} 失败:`, error);
          state.errorMessage.value = `处理文件 ${fileInfo.name} 失败: ${error.message || '未知错误'}`;
          // 继续处理其他文件
        }
      }

      if (state.errorMessage.value) {
        // 如果有错误但仍然有成功添加的文件，继续生成ZIP
        console.warn('部分文件添加失败，继续生成ZIP');
      }

      // 生成ZIP文件
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      }, (metadata) => {
        // 后50%进度用于生成ZIP
        updateProgress(50 + metadata.percent / 2);
      });

      if (blob.size === 0) {
        throw new Error('生成的ZIP文件为空');
      }

      state.compressedFile.value = blob;
      state.compressedSize.value = formatSize(blob.size);
      state.totalSize.value = formatSize(getTotalSize.value);
      state.compressionRatio.value = Math.round((1 - blob.size / getTotalSize.value) * 100);
      state.compressionProgress.value = 100;
    } catch (error) {
      console.error('压缩失败:', error);
      state.errorMessage.value = `压缩失败: ${error.message || '未知错误'}`;
      state.compressedFile.value = null;
    } finally {
      state.isCompressing.value = false;
    }
  };

  const addFileToZipWithRetry = async (zip: JSZip, file: File, relativePath: string, retries = 3) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        // 创建文件的副本以避免引用失效
        const fileBlob = file.slice(0, file.size, file.type);
        const fileCopy = new File([fileBlob], file.name, { type: file.type });
        await addFileToZip(zip, fileCopy, relativePath);
        return; // 成功则直接返回
      } catch (error) {
        console.warn(`添加文件失败，重试 ${i + 1}/${retries}:`, error);
        lastError = error;
        // 等待一小段时间再重试
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    // 所有重试都失败，抛出最后一个错误
    throw lastError;
  };

  const addFileToZip = async (zip: JSZip, file: File, relativePath: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // 检查文件是否可读
        if (!file.size) {
          reject(new Error('文件为空或无法访问'));
          return;
        }

        // 对于大文件，使用分块处理
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
        if (file.size > CHUNK_SIZE) {
          const chunks: ArrayBuffer[] = [];
          let offset = 0;

          while (offset < file.size) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            try {
              const buffer = await chunk.arrayBuffer();
              chunks.push(buffer);
              offset += CHUNK_SIZE;
              
              // 更新进度
              state.processedBytes.value = Math.min(
                state.totalBytes.value,
                state.processedBytes.value + buffer.byteLength
              );
            } catch (error) {
              reject(new Error(`分块读取失败: ${error.message || '未知错误'}`));
              return;
            }
          }

          // 合并所有分块
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
          const combinedArray = new Uint8Array(totalLength);
          let position = 0;
          
          for (const chunk of chunks) {
            combinedArray.set(new Uint8Array(chunk), position);
            position += chunk.byteLength;
          }

          // 添加到zip
          zip.file(relativePath, combinedArray);
          resolve();
        } else {
          // 小文件直接使用arrayBuffer
          try {
            const buffer = await file.arrayBuffer();
            zip.file(relativePath, buffer);
            state.processedBytes.value += buffer.byteLength;
            resolve();
          } catch (error) {
            reject(new Error(`文件读取失败: ${error.message || '未知错误'}`));
          }
        }
      } catch (error) {
        reject(new Error(`处理文件失败: ${error.message || '未知错误'}`));
      }
    });
  };

  const processDirectoryEntry = async (zip: JSZip, dirEntry: any, path = '') => {
    try {
      const entries = await getAllEntries(dirEntry);
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue; // 跳过目录项，因为文件会自动创建目录
        }
        try {
          const file = await getFileFromEntry(entry);
          // 创建文件的副本
          const fileBlob = file.slice(0, file.size, file.type);
          const fileCopy = new File([fileBlob], file.name, { type: file.type });
          const relativePath = path ? `${path}/${entry.fullPath}` : entry.fullPath;
          await addFileToZipWithRetry(zip, fileCopy, relativePath.replace(/^\//, ''));
        } catch (error) {
          console.error(`处理目录项 ${entry.fullPath} 失败:`, error);
          // 继续处理其他文件
        }
      }
    } catch (error) {
      throw new Error(`处理目录失败: ${error.message || '未知错误'}`);
    }
  };

  const updateProgress = (percent: number) => {
    state.compressionProgress.value = Math.round(Math.max(0, Math.min(100, percent)));
  };

  const downloadZip = () => {
    if (!state.compressedFile.value) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(state.compressedFile.value);
    link.download = `${state.zipName.value || 'compressed'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const clearFiles = (fileInputRef: Ref<HTMLInputElement | null>) => {
    state.files.value = [];
    state.zipName.value = '';
    state.compressedFile.value = null;
    state.compressedSize.value = '';
    state.totalSize.value = '';
    state.compressionRatio.value = 0;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  };

  // 处理回车键事件
  const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && hasFiles.value && !state.isCompressing.value) {
      compressFiles();
    }
  };

  return {
    ...state,
    hasFiles,
    totalFiles,
    getTotalSize,
    selectFiles,
    selectDirectory,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    addFile,
    removeFile,
    getFileIcon,
    formatSize,
    compressFiles,
    downloadZip,
    clearFiles,
    handleEnterKey
  };
}

/**
 * 处理文件添加
 * @param {JSZip} zip ZIP对象
 * @param {FileInfo} fileInfo 文件信息
 * @param {Object} options 选项
 * @returns {Promise<void>}
 */
async function processFile(zip: JSZip, fileInfo: FileInfo, options: ZipOptions): Promise<void> {
  try {
    // 获取文件内容
    const content = await fileToArrayBuffer(fileInfo.file);
    
    // 添加到ZIP
    zip.file(fileInfo.relativePath, content, {
      binary: true,
      compression: options.compression || 'DEFLATE',
      compressionOptions: {
        level: options.compressionLevel || 6
      }
    });
  } catch (error) {
    // 处理文件失败
    if (options.continueOnError) {
      // 继续处理其他文件
      return;
    } else {
      throw new Error(`处理文件 ${fileInfo.name} 失败`);
    }
  }
}

/**
 * 添加文件到ZIP
 * @param {JSZip} zip ZIP对象
 * @param {FileInfo} fileInfo 文件信息
 * @param {Object} options 选项
 * @returns {Promise<void>}
 */
async function addFileToZip(zip: JSZip, fileInfo: FileInfo, options: ZipOptions): Promise<void> {
  const retries = options.retries || 1;
  
  for (let i = 0; i < retries; i++) {
    try {
      await processFile(zip, fileInfo, options);
      return;
    } catch (error) {
      if (i === retries - 1) {
        // 最后一次重试失败
        if (options.continueOnError) {
          // 继续处理其他文件
          return;
        } else {
          throw error;
        }
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * 创建ZIP文件
 * @param {FileInfo[]} files 要添加的文件
 * @param {Object} options 压缩选项
 * @returns {Promise<Blob>} ZIP文件的Blob对象
 */
export async function createZip(files: FileInfo[], options: ZipOptions = {}): Promise<Blob> {
  try {
    // 创建新的ZIP
    const zip = new JSZip();
    
    // 添加文件到ZIP
    const failedFiles: FileInfo[] = [];
    
    for (const fileInfo of files) {
      try {
        await addFileToZip(zip, fileInfo, options);
      } catch (error) {
        failedFiles.push(fileInfo);
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    }
    
    // 如果有失败的文件但设置了继续处理
    if (failedFiles.length > 0 && options.continueOnError) {
      // 继续生成ZIP
    }
    
    // 生成ZIP文件
    return await zip.generateAsync({
      type: 'blob',
      compression: options.compression || 'DEFLATE',
      compressionOptions: {
        level: options.compressionLevel || 6
      }
    });
  } catch (error) {
    // 压缩失败
    throw new Error('压缩失败，请重试');
  }
}

/**
 * 处理目录项
 * @param {FileSystemDirectoryEntry} entry 目录条目
 * @param {string} basePath 基础路径
 * @param {Object} options 选项
 * @returns {Promise<FileInfo[]>} 文件信息数组
 */
export async function processDirectoryEntry(entry: FileSystemDirectoryEntry, basePath: string = '', options: ZipOptions = {}): Promise<FileInfo[]> {
  try {
    const files: FileInfo[] = [];
    const reader = entry.createReader();
    
    // 读取目录内容
    const entries = await readDirectoryEntries(reader);
    
    // 处理每个条目
    for (const childEntry of entries) {
      try {
        if (childEntry.isFile) {
          // 处理文件
          const fileEntry = childEntry as FileSystemFileEntry;
          const file = await fileEntryToFile(fileEntry);
          
          const relativePath = basePath ? `${basePath}/${fileEntry.name}` : fileEntry.name;
          
          files.push({
            file,
            name: fileEntry.name,
            relativePath,
            size: file.size,
            type: file.type || getMimeType(fileEntry.name),
            lastModified: file.lastModified
          });
        } else if (childEntry.isDirectory) {
          // 处理子目录
          const dirEntry = childEntry as FileSystemDirectoryEntry;
          const dirPath = basePath ? `${basePath}/${dirEntry.name}` : dirEntry.name;
          
          // 递归处理子目录
          const subFiles = await processDirectoryEntry(dirEntry, dirPath, options);
          files.push(...subFiles);
        }
      } catch (error) {
        // 处理单个条目失败
        if (!options.continueOnError) {
          throw error;
        }
      }
    }
    
    return files;
  } catch (error) {
    // 处理目录失败
    throw new Error(`处理目录失败`);
  }
} 