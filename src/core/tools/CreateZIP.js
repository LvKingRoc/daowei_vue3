// ZIP 创建工具（纯 JavaScript 版本）
// 尽量保持与原有 CreateZIP.ts 的导出接口一致：
// - useZipCompressor()
// - createZip(files, options?)
// - processDirectoryEntry(entry, basePath?, options?)

import { ref, computed } from 'vue';
import JSZip from 'jszip';

// 简单的文件大小格式化
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 基础 MIME 类型映射（用于目录处理导出的 createZip/processDirectoryEntry）
function getMimeType(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const map = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    csv: 'text/csv',
    xml: 'text/xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip'
  };
  return map[ext] || 'application/octet-stream';
}

// =============== 组合式函数：工具页内部使用 ===============

export function useZipCompressor() {
  const state = {
    isDragging: ref(false),
    files: ref([]), // { name,size,isDirectory, entry?, files?, file?, relativePath? }
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
    state.files.value.reduce((total, file) => total + (file.size || 0), 0)
  );

  const selectFiles = (fileInputRef) => {
    state.isSelectingDirectory.value = false;
    setTimeout(() => {
      const input = fileInputRef && fileInputRef.value;
      if (input) {
        input.value = '';
        input.click();
      }
    });
  };

  const selectDirectory = (fileInputRef) => {
    state.isSelectingDirectory.value = true;
    setTimeout(() => {
      const input = fileInputRef && fileInputRef.value;
      if (input) {
        input.value = '';
        input.click();
      }
    });
  };

  const handleDragOver = (e) => {
    state.isDragging.value = true;
    if (e && e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = () => {
    state.isDragging.value = false;
  };

  const handleDrop = async (e) => {
    state.isDragging.value = false;
    const items = e && e.dataTransfer ? e.dataTransfer.items : null;
    if (!items) return;

    let isFirst = !state.zipName.value;

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
        if (!entry) continue;

        if (entry.isDirectory) {
          const dirSize = await calculateDirectorySize(entry);
          addFile({
            name: entry.name,
            size: dirSize,
            isDirectory: true,
            entry
          });
          if (isFirst) {
            state.zipName.value = entry.name;
            isFirst = false;
          }
        } else {
          const file = await getFileFromEntry(entry);
          addFile({
            name: file.name,
            size: file.size,
            isDirectory: false,
            file
          });
          if (isFirst) {
            const base = file.name.split('.').slice(0, -1).join('.') || file.name;
            state.zipName.value = base;
            isFirst = false;
          }
        }
      }
    }
  };

  const calculateDirectorySize = async (dirEntry) => {
    const entries = await getAllEntries(dirEntry);
    let total = 0;
    for (const entry of entries) {
      if (!entry.isDirectory) {
        const file = await getFileFromEntry(entry);
        total += file.size;
      }
    }
    return total;
  };

  const getFileFromEntry = (entry) => {
    return new Promise((resolve, reject) => {
      try {
        entry.file(resolve, reject);
      } catch (err) {
        reject(err);
      }
    });
  };

  const getAllEntries = async (dirEntry) => {
    const entries = [];
    const reader = dirEntry.createReader();

    const readEntries = async () => {
      const batch = await new Promise((resolve) => reader.readEntries(resolve));
      if (batch.length) {
        entries.push(...batch);
        await readEntries();
      }
    };

    await readEntries();
    return entries;
  };

  const handleFileSelect = (e) => {
    const target = e && e.target ? e.target : null;
    const fileList = target && target.files ? Array.from(target.files) : [];
    if (!fileList.length) return;

    if (state.isSelectingDirectory.value && fileList[0].webkitRelativePath) {
      // 目录选择场景
      const baseDir = fileList[0].webkitRelativePath.split('/')[0];
      if (baseDir) {
        const total = fileList.reduce((sum, f) => sum + f.size, 0);
        const filesCopy = fileList.map((f) => {
          const blob = f.slice(0, f.size, f.type);
          return new File([blob], f.name, { type: f.type });
        });
        addFile({
          name: baseDir,
          size: total,
          isDirectory: true,
          files: filesCopy
        });
        if (!state.zipName.value) state.zipName.value = baseDir;
      }
    } else {
      fileList.forEach((f, index) => {
        const blob = f.slice(0, f.size, f.type);
        const copy = new File([blob], f.name, { type: f.type });
        addFile({
          name: f.name,
          size: f.size,
          isDirectory: false,
          file: copy
        });
        if (index === 0 && !state.zipName.value) {
          const base = f.name.split('.').slice(0, -1).join('.') || f.name;
          state.zipName.value = base;
        }
      });
    }

    if (target) target.value = '';
  };

  const addFile = (fileInfo) => {
    const idx = state.files.value.findIndex((f) => f.name === fileInfo.name);
    if (idx !== -1) state.files.value.splice(idx, 1);
    state.files.value.push(fileInfo);
  };

  const removeFile = (index) => {
    state.files.value.splice(index, 1);
    if (!state.files.value.length) {
      state.compressedFile.value = null;
      state.zipName.value = '';
    }
  };

  const getFileIcon = (file) => {
    if (file.isDirectory) return 'fa-folder';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const map = {
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
    return map[ext] || 'fa-file';
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
      const total = state.files.value.length;
      let processed = 0;

      for (const info of state.files.value) {
        try {
          if (info.isDirectory) {
            if (info.files && info.files.length) {
              for (const f of info.files) {
                const rel = f.webkitRelativePath || `${info.name}/${f.name}`;
                await addFileToZipSimple(zip, f, rel);
              }
            } else if (info.entry) {
              await processDirectoryEntryInternal(zip, info.entry);
            }
          } else if (info.file) {
            await addFileToZipSimple(zip, info.file, info.file.name);
          }
        } catch (err) {
          console.error('处理文件失败:', info.name, err);
          state.errorMessage.value = `处理文件 ${info.name} 失败`;
        }
        processed += 1;
        state.compressionProgress.value = Math.round((processed / total) * 50);
      }

      const blob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 }
        },
        (meta) => {
          // 后 50% 进度用于生成 zip
          state.compressionProgress.value = 50 + Math.round(meta.percent / 2);
        }
      );

      if (!blob || blob.size === 0) {
        throw new Error('生成的ZIP文件为空');
      }

      state.compressedFile.value = blob;
      state.compressedSize.value = formatSize(blob.size);
      state.totalSize.value = formatSize(getTotalSize.value);
      state.compressionRatio.value = Math.round(
        (1 - blob.size / (getTotalSize.value || 1)) * 100
      );
      state.compressionProgress.value = 100;
    } catch (err) {
      console.error('压缩失败:', err);
      const msg = err && err.message ? err.message : '未知错误';
      state.errorMessage.value = `压缩失败: ${msg}`;
      state.compressedFile.value = null;
    } finally {
      state.isCompressing.value = false;
    }
  };

  const addFileToZipSimple = async (zip, file, relativePath) => {
    const buffer = await file.arrayBuffer();
    zip.file(relativePath, buffer);
    state.processedBytes.value = Math.min(
      state.totalBytes.value,
      state.processedBytes.value + buffer.byteLength
    );
  };

  const processDirectoryEntryInternal = async (zip, dirEntry, path = '') => {
    const entries = await getAllEntries(dirEntry);
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      try {
        const file = await getFileFromEntry(entry);
        const blob = file.slice(0, file.size, file.type);
        const copy = new File([blob], file.name, { type: file.type });
        const rel = path ? `${path}/${entry.fullPath}` : entry.fullPath;
        await addFileToZipSimple(zip, copy, rel.replace(/^\//, ''));
      } catch (err) {
        console.error('处理目录项失败:', entry.fullPath, err);
      }
    }
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

  const clearFiles = (fileInputRef) => {
    state.files.value = [];
    state.zipName.value = '';
    state.compressedFile.value = null;
    state.compressedSize.value = '';
    state.totalSize.value = '';
    state.compressionRatio.value = 0;
    const input = fileInputRef && fileInputRef.value;
    if (input) input.value = '';
  };

  const handleEnterKey = (event) => {
    if (event && event.key === 'Enter' && hasFiles.value && !state.isCompressing.value) {
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

// =============== 通用 ZIP API：供其他逻辑直接调用 ===============

async function fileToArrayBuffer(file) {
  if (!file) throw new Error('文件不存在');
  return file.arrayBuffer();
}

async function readDirectoryEntries(reader) {
  return new Promise((resolve) => reader.readEntries(resolve));
}

async function fileEntryToFile(fileEntry) {
  return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
}

async function processFile(zip, fileInfo, options) {
  const opts = options || {};
  try {
    const content = await fileToArrayBuffer(fileInfo.file);
    const relPath = fileInfo.relativePath || fileInfo.name;
    zip.file(relPath, content, {
      binary: true,
      compression: opts.compression || 'DEFLATE',
      compressionOptions: {
        level: opts.compressionLevel || 6
      }
    });
  } catch (err) {
    if (opts.continueOnError) {
      return;
    }
    throw new Error(`处理文件 ${fileInfo.name} 失败`);
  }
}

async function addFileToZip(zip, fileInfo, options) {
  const retries = (options && options.retries) || 1;
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      await processFile(zip, fileInfo, options);
      return;
    } catch (err) {
      lastError = err;
      if (i === retries - 1) {
        if (options && options.continueOnError) return;
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (lastError) throw lastError;
}

/**
 * 创建 ZIP（通用函数）
 * @param files 形如 { file,name,relativePath,size,... } 的数组，或 File[]
 * @param options { compression, compressionLevel, continueOnError, retries }
 */
export async function createZip(files, options = {}) {
  try {
    const zip = new JSZip();
    const list = Array.isArray(files) ? files : [];
    const failed = [];

    for (const item of list) {
      const fileInfo =
        item instanceof File
          ? {
              file: item,
              name: item.name,
              relativePath: item.name,
              size: item.size
            }
          : item;
      try {
        await addFileToZip(zip, fileInfo, options);
      } catch (err) {
        failed.push(fileInfo);
        if (!options.continueOnError) {
          throw err;
        }
      }
    }

    // 生成 ZIP Blob
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: options.compression || 'DEFLATE',
      compressionOptions: {
        level: options.compressionLevel || 6
      }
    });

    return blob;
  } catch (err) {
    throw new Error('压缩失败，请重试');
  }
}

/**
 * 处理目录条目，递归收集其中的文件（通用函数）
 * 返回 FileInfo[]，可直接传给 createZip 使用
 */
export async function processDirectoryEntry(entry, basePath = '', options = {}) {
  try {
    const files = [];
    const reader = entry.createReader();
    const entries = await readDirectoryEntries(reader);

    for (const child of entries) {
      try {
        if (child.isFile) {
          const fileEntry = child;
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
        } else if (child.isDirectory) {
          const dirEntry = child;
          const dirPath = basePath ? `${basePath}/${dirEntry.name}` : dirEntry.name;
          const sub = await processDirectoryEntry(dirEntry, dirPath, options);
          files.push(...sub);
        }
      } catch (err) {
        if (!options.continueOnError) throw err;
      }
    }

    return files;
  } catch (err) {
    throw new Error('处理目录失败');
  }
}
