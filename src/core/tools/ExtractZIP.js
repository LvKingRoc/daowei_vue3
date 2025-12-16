// ZIP 解压工具（纯 JavaScript 版本）
// 保持与原 ExtractZIP.ts 接口基本一致：
// - useExtractZIP()
// - validateZipFile(file)

import { ref, computed } from 'vue';
import JSZip from 'jszip';

// 基础 MIME 类型映射
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
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  return map[ext] || 'application/octet-stream';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function createDirectoryObject(path) {
  const parts = path.split('/').filter(Boolean);
  return {
    name: parts[parts.length - 1] || '',
    path,
    isDirectory: true
  };
}

function buildFileTree(files, directories) {
  const tree = [];

  // 先建目录节点
  directories.forEach((dir) => {
    const parts = dir.path.split('/').filter(Boolean);
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const path = parts.slice(0, i + 1).join('/');
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path, isDirectory: true, children: [] };
        current.push(node);
      }
      current = node.children || (node.children = []);
    }
  });

  // 再挂文件
  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    const fileName = parts.pop() || file.name;
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDirectory: true,
          children: []
        };
        current.push(node);
      }
      current = node.children || (node.children = []);
    }
    current.push({
      name: fileName,
      path: file.path,
      isDirectory: false,
      file
    });
  });

  return tree;
}

async function loadJSZip() {
  return JSZip;
}

// =============== 组合式函数：工具页内部使用 ===============

export function useExtractZIP() {
  const isDragging = ref(false);
  const zipFile = ref(null);
  const extractedFiles = ref([]); // { name,size,type,url?,path?,isDirectory? }
  const isExtracting = ref(false);
  const extractProgress = ref(0);
  const totalFiles = ref(0);
  const extractedCount = ref(0);
  const errorMessage = ref(null);

  const totalBytes = ref(0);
  const processedBytes = ref(0);

  const hasZipFile = computed(() => !!zipFile.value);
  const hasExtractedFiles = computed(() => extractedFiles.value.length > 0);
  const extractedFilesCount = computed(() => extractedFiles.value.length);
  const totalSize = computed(() =>
    extractedFiles.value.reduce((sum, f) => sum + (f.size || 0), 0)
  );
  const extractError = computed(() => errorMessage.value);

  const handleDragOver = () => {
    isDragging.value = true;
  };

  const handleDragLeave = () => {
    isDragging.value = false;
  };

  const handleDrop = (e) => {
    isDragging.value = false;
    const file = e && e.dataTransfer && e.dataTransfer.files
      ? e.dataTransfer.files[0]
      : null;
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else if (file) {
      errorMessage.value = '只支持ZIP格式文件';
    }
  };

  const handleFileSelect = (e) => {
    const target = e && e.target ? e.target : null;
    const file = target && target.files ? target.files[0] : null;
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else if (file) {
      errorMessage.value = '只支持ZIP格式文件';
    }
  };

  const processZipFile = (file) => {
    zipFile.value = file;
    errorMessage.value = null;
  };

  async function extractFile(zipEntry, path) {
    try {
      const blob = await zipEntry.async('blob');
      const url = URL.createObjectURL(blob);
      return {
        name: (path.split('/').pop() || ''),
        path,
        size: blob.size,
        type: getMimeType(path),
        url,
        isDirectory: false,
        date: zipEntry.date
      };
    } catch (err) {
      throw new Error(`解压文件 ${path} 失败`);
    }
  }

  async function extractZipInternal(file, options = {}) {
    try {
      const JSZipLib = await loadJSZip();
      const zip = await JSZipLib.loadAsync(file);

      const files = [];
      const directories = [];
      const entries = Object.keys(zip.files);

      for (const entryName of entries) {
        const zipEntry = zip.files[entryName];
        if (zipEntry.dir) {
          directories.push(createDirectoryObject(entryName));
        } else {
          try {
            const fileObj = await extractFile(zipEntry, entryName, options);
            files.push(fileObj);
          } catch (err) {
            if (options.continueOnError !== false) {
              continue;
            }
            throw err;
          }
        }
      }

      const fileTree = buildFileTree(files, directories);
      return { files, directories, fileTree, count: files.length };
    } catch (err) {
      throw new Error('解压失败，请检查文件格式');
    }
  }

  const downloadSingleFile = (file) => {
    if (!file || !file.url) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const clearFiles = (fileInputRef) => {
    // 释放 URL
    extractedFiles.value.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });

    zipFile.value = null;
    extractedFiles.value = [];
    isExtracting.value = false;
    extractProgress.value = 0;
    totalFiles.value = 0;
    extractedCount.value = 0;
    errorMessage.value = null;

    const input = fileInputRef && fileInputRef.value;
    if (input) input.value = '';
  };

  const clearAll = () => {
    extractedFiles.value.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    zipFile.value = null;
    extractedFiles.value = [];
    isExtracting.value = false;
    extractProgress.value = 0;
    totalFiles.value = 0;
    extractedCount.value = 0;
    errorMessage.value = null;
  };

  const executeExtract = async () => {
    if (!zipFile.value) {
      errorMessage.value = '请先选择ZIP文件';
      return;
    }

    try {
      isExtracting.value = true;
      extractProgress.value = 0;
      errorMessage.value = null;

      const result = await extractZipInternal(zipFile.value, {
        continueOnError: true
      });

      extractedFiles.value = result.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url,
        path: f.path,
        isDirectory: f.isDirectory
      }));

      totalFiles.value = result.count;
      extractedCount.value = result.count;
      extractProgress.value = 100;
    } catch (err) {
      errorMessage.value = err && err.message ? err.message : '解压失败，请检查文件格式';
    } finally {
      isExtracting.value = false;
    }
  };

  return {
    isDragging,
    zipFile,
    extractedFiles,
    isExtracting,
    extractProgress,
    totalFiles,
    extractedCount,
    errorMessage,
    totalBytes,
    processedBytes,
    hasZipFile,
    hasExtractedFiles,
    extractedFilesCount,
    totalSize,
    extractError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    processZipFile,
    // 为兼容原接口，暴露 extractZip 名称
    extractZip: executeExtract,
    downloadSingleFile,
    formatSize,
    getFileIcon: (file) => {
      if (file.isDirectory) return 'fa-folder';
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!ext) return 'fa-file';
      switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'svg':
          return 'fa-file-image';
        case 'pdf':
          return 'fa-file-pdf';
        case 'doc':
        case 'docx':
          return 'fa-file-word';
        case 'xls':
        case 'xlsx':
          return 'fa-file-excel';
        case 'ppt':
        case 'pptx':
          return 'fa-file-powerpoint';
        case 'txt':
          return 'fa-file-text';
        case 'html':
        case 'htm':
        case 'css':
        case 'js':
        case 'json':
        case 'xml':
          return 'fa-file-code';
        case 'zip':
        case 'rar':
        case '7z':
          return 'fa-file-archive';
        case 'mp3':
        case 'wav':
        case 'flac':
          return 'fa-file-audio';
        case 'mp4':
        case 'avi':
        case 'mov':
          return 'fa-file-video';
        default:
          return 'fa-file';
      }
    },
    clearFiles,
    clearAll
  };
}

// =============== 额外导出：文件级验证 ===============

export function validateZipFile(file) {
  if (!file || !file.name) {
    return { valid: false, message: '文件无效' };
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    return {
      valid: false,
      message: '只能上传ZIP格式的文件！'
    };
  }

  const maxSizeMB = 100;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      message: `文件大小不能超过${maxSizeMB}MB！`
    };
  }

  return { valid: true };
}
