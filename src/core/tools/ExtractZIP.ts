import { ref, Ref, computed } from 'vue';
import JSZip from 'jszip';

// 添加必要的类型定义
interface ExtractOptions {
  continueOnError?: boolean;
  createFolders?: boolean;
}

interface ExtractedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
  isDirectory: boolean;
  date?: Date;
}

interface ExtractedDirectory {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: ExtractedFile;
}

interface ExtractResult {
  files: ExtractedFile[];
  directories: ExtractedDirectory[];
  fileTree: FileTreeNode[];
  count: number;
}

interface ExtractZIPState {
  isDragging: Ref<boolean>;
  zipFile: Ref<File | null>;
  extractedFiles: Ref<Array<{name: string, size: number, type: string, url?: string, path?: string, isDirectory?: boolean}>>;
  isExtracting: Ref<boolean>;
  extractProgress: Ref<number>;
  totalFiles: Ref<number>;
  extractedCount: Ref<number>;
  errorMessage: Ref<string | null>;
  totalBytes: Ref<number>;
  processedBytes: Ref<number>;
}

/**
 * 加载JSZip库
 * @returns {Promise<typeof JSZip>} JSZip库
 */
async function loadJSZip(): Promise<typeof JSZip> {
  return JSZip;
}

/**
 * 根据文件名获取MIME类型
 * @param {string} fileName 文件名
 * @returns {string} MIME类型
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'csv': 'text/csv',
    'xml': 'text/xml',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  
  return extension && mimeTypes[extension] ? mimeTypes[extension] : 'application/octet-stream';
}

/**
 * 创建目录对象
 * @param {string} path 目录路径
 * @returns {ExtractedDirectory} 目录对象
 */
function createDirectoryObject(path: string): ExtractedDirectory {
  return {
    name: path.split('/').filter(Boolean).pop() || '',
    path,
    isDirectory: true
  };
}

/**
 * 构建文件树
 * @param {ExtractedFile[]} files 文件列表
 * @param {ExtractedDirectory[]} directories 目录列表
 * @returns {FileTreeNode[]} 文件树
 */
function buildFileTree(files: ExtractedFile[], directories: ExtractedDirectory[]): FileTreeNode[] {
  const tree: FileTreeNode[] = [];
  
  // 添加所有目录
  for (const dir of directories) {
    const parts = dir.path.split('/').filter(Boolean);
    let currentLevel = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const path = parts.slice(0, i + 1).join('/');
      
      let node = currentLevel.find(n => n.name === part);
      if (!node) {
        node = {
          name: part,
          path,
          isDirectory: true,
          children: []
        };
        currentLevel.push(node);
      }
      
      currentLevel = node.children || [];
    }
  }
  
  // 添加所有文件
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    const fileName = parts.pop() || file.name;
    let currentLevel = tree;
    
    // 遍历路径
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let node = currentLevel.find(n => n.name === part);
      
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDirectory: true,
          children: []
        };
        currentLevel.push(node);
      }
      
      currentLevel = node.children || [];
    }
    
    // 添加文件节点
    currentLevel.push({
      name: fileName,
      path: file.path,
      isDirectory: false,
      file
    });
  }
  
  return tree;
}

/**
 * ZIP文件解压组合式函数
 * @returns ZIP解压相关状态和方法
 */
export function useExtractZIP() {
  const state: ExtractZIPState = {
    isDragging: ref(false),
    zipFile: ref(null),
    extractedFiles: ref([]),
    isExtracting: ref(false),
    extractProgress: ref(0),
    totalFiles: ref(0),
    extractedCount: ref(0),
    errorMessage: ref(null),
    totalBytes: ref(0),
    processedBytes: ref(0)
  };

  // 计算属性
  const hasZipFile = computed(() => !!state.zipFile.value);
  const hasExtractedFiles = computed(() => state.extractedFiles.value.length > 0);
  const extractedFilesCount = computed(() => state.extractedFiles.value.length);
  const totalSize = computed(() => 
    state.extractedFiles.value.reduce((total, file) => total + file.size, 0)
  );
  const extractError = computed(() => state.errorMessage.value);

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
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else if (file) {
      state.errorMessage.value = '只支持ZIP格式文件';
    }
  };

  /**
   * 处理文件选择
   * @param e 文件选择事件
   */
  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else if (file) {
      state.errorMessage.value = '只支持ZIP格式文件';
    }
  };

  /**
   * 处理ZIP文件
   * @param file ZIP文件
   */
  const processZipFile = (file: File) => {
    state.zipFile.value = file;
    state.errorMessage.value = null;
  };

  /**
   * 提取单个文件
   * @param {JSZip.JSZipObject} zipEntry ZIP文件条目
   * @param {string} path 文件路径
   * @param {Object} options 选项
   * @returns {Promise<ExtractedFile>} 提取的文件对象
   */
  async function extractFile(zipEntry: JSZip.JSZipObject, path: string, options: ExtractOptions): Promise<ExtractedFile> {
    try {
      // 获取文件内容
      const blob = await zipEntry.async('blob');
      
      // 创建文件URL
      const url = URL.createObjectURL(blob);
      
      // 返回文件信息
      return {
        name: path.split('/').pop() || '',
        path,
        size: blob.size,
        type: getMimeType(path),
        url,
        isDirectory: false,
        date: zipEntry.date
      };
    } catch (error) {
      // 解压文件失败
      throw new Error(`解压文件 ${path} 失败`);
    }
  }

  /**
   * 解压ZIP文件
   * @param {File} file ZIP文件
   * @param {Object} options 解压选项
   * @returns {Promise<ExtractResult>} 解压结果
   */
  async function extractZip(file: File, options: ExtractOptions = {}): Promise<ExtractResult> {
    try {
      // 加载JSZip库
      const JSZip = await loadJSZip();
      
      // 读取ZIP文件
      const zip = await JSZip.loadAsync(file);
      
      // 提取文件
      const files: ExtractedFile[] = [];
      const directories: ExtractedDirectory[] = [];
      
      // 处理ZIP条目
      const entries = Object.keys(zip.files);
      
      for (const entry of entries) {
        const zipEntry = zip.files[entry];
        
        if (zipEntry.dir) {
          // 处理目录
          directories.push(createDirectoryObject(entry));
        } else {
          // 处理文件
          try {
            const file = await extractFile(zipEntry, entry, options);
            files.push(file);
          } catch (error) {
            // 单个文件解压失败，继续处理其他文件
            if (options.continueOnError !== false) {
              continue;
            } else {
              throw error;
            }
          }
        }
      }
      
      // 构建文件树
      const fileTree = buildFileTree(files, directories);
      
      return {
        files,
        directories,
        fileTree,
        count: files.length
      };
    } catch (error) {
      // 解压失败
      throw new Error('解压失败，请检查文件格式');
    }
  }

  /**
   * 下载单个文件
   * @param file 要下载的文件
   */
  const downloadSingleFile = (file: {name: string, url?: string}) => {
    if (!file.url) return;
    
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的大小字符串
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  /**
   * 获取文件图标
   * @param file 文件对象
   * @returns 图标类名
   */
  const getFileIcon = (file: {name: string, type: string, isDirectory?: boolean}): string => {
    if (file.isDirectory) {
      return 'fa-folder';
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return 'fa-file';
    
    switch (extension) {
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
        return 'fa-file-code';
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
  };

  /**
   * 清除文件
   * @param fileInput 文件输入元素
   */
  const clearFiles = (fileInput: any) => {
    // 释放所有对象URL，避免内存泄漏
    state.extractedFiles.value.forEach(file => {
      if (file.url) URL.revokeObjectURL(file.url);
    });
    
    state.zipFile.value = null;
    state.extractedFiles.value = [];
    state.isExtracting.value = false;
    state.extractProgress.value = 0;
    state.totalFiles.value = 0;
    state.extractedCount.value = 0;
    state.errorMessage.value = null;
    
    // 清除文件输入
    if (fileInput && fileInput.value) {
      fileInput.value.value = '';
    }
  };

  /**
   * 清除所有数据
   */
  const clearAll = () => {
    // 释放所有对象URL，避免内存泄漏
    state.extractedFiles.value.forEach(file => {
      if (file.url) URL.revokeObjectURL(file.url);
    });

    state.zipFile.value = null;
    state.extractedFiles.value = [];
    state.isExtracting.value = false;
    state.extractProgress.value = 0;
    state.totalFiles.value = 0;
    state.extractedCount.value = 0;
    state.errorMessage.value = null;
  };

  /**
   * 执行解压操作
   */
  const executeExtract = async () => {
    if (!state.zipFile.value) {
      state.errorMessage.value = '请先选择ZIP文件';
      return;
    }

    try {
      state.isExtracting.value = true;
      state.extractProgress.value = 0;
      state.errorMessage.value = null;

      // 执行解压
      const result = await extractZip(state.zipFile.value, { continueOnError: true });

      // 更新状态
      state.extractedFiles.value = result.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        path: file.path,
        isDirectory: file.isDirectory
      }));

      state.totalFiles.value = result.count;
      state.extractedCount.value = result.count;
      state.extractProgress.value = 100;

    } catch (error: any) {
      state.errorMessage.value = error.message || '解压失败，请检查文件格式';
    } finally {
      state.isExtracting.value = false;
    }
  };

  return {
    ...state,
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
    extractFile,
    extractZip: executeExtract,  // 将执行解压的函数暴露为 extractZip
    downloadSingleFile,
    formatSize,
    getFileIcon,
    clearFiles,
    clearAll
  };
}

/**
 * 验证ZIP文件
 * @param file 文件对象
 * @returns 验证结果
 */
export const validateZipFile = (file: File): { valid: boolean; message?: string } => {
  // 验证文件扩展名
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return {
      valid: false,
      message: '只能上传ZIP格式的文件！'
    };
  }
  
  // 验证文件大小（默认最大100MB）
  const maxSizeMB = 100;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      message: `文件大小不能超过${maxSizeMB}MB！`
    };
  }
  
  return { valid: true };
};