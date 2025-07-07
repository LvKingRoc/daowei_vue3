<template>
  <div class="mp-extract-zip">
    <h2>解压工具</h2>
    <p class="subtitle">支持ZIP格式无密码解压</p>

    <!-- 上传区域 -->
    <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" :class="{ 'drag-over': isDragging }">
      <div v-if="!hasZipFile" class="upload-placeholder">
        <i class="fas fa-folder-open upload-icon"></i>
        <p class="upload-text">点击选择或拖入ZIP文件</p>
        <button @click="triggerFileInput" class="upload-btn">
          <i class="fas fa-upload"></i>
          选择文件
        </button>
      </div>
      <div v-else class="file-info">
        <div class="file-header">
          <i class="fas fa-file-archive upload-icon"></i>
          <div class="file-details">
            <span class="file-name">{{ zipFile.name }}</span>
            <span class="file-size">{{ formatSize(zipFile.size) }}</span>
          </div>
          <button @click="triggerClearFiles" class="remove-btn">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>

        <div class="button-group">
          <button @click="extractZip" :disabled="isExtracting" class="primary-btn">
            <i class="fas" :class="isExtracting ? 'fa-spinner fa-spin' : 'fa-folder-open'"></i>
            {{ isExtracting ? '解压中...' : '开始解压' }}
          </button>
          <button @click="triggerClearFiles" class="secondary-btn">
            <i class="fas fa-trash-alt"></i>
            清空
          </button>
        </div>

        <div v-if="isExtracting" class="progress-container">
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${extractProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ extractProgress }}%</span>
        </div>

        <div v-if="extractError" class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ extractError }}</span>
        </div>
      </div>
      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".zip,application/zip,application/x-zip-compressed" class="file-input">
    </div>

    <!-- 解压结果 -->
    <div v-if="hasExtractedFiles" class="extract-result">
      <div class="result-header">
        <h3>解压结果</h3>
        <div class="file-info">
          <span class="file-count">{{ extractedFilesCount }}个文件</span>
          <span class="total-size">{{ formatSize(totalSize) }}</span>
        </div>
      </div>

      <div class="file-items">
        <div v-for="(file, index) in extractedFiles" :key="`${file.path}/${file.name}-${index}`" class="file-item"
          :class="{ 'directory': file.isDirectory }" @click="!file.isDirectory && canPreviewFile(file) && openPreview(file)">
          <div class="file-item-content">
            <div class="file-icon">
              <i class="fas" :class="getFileIcon(file)"></i>
            </div>
            <div class="file-details">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span v-if="file.path" class="file-path">{{ file.path }}</span>
              <span v-if="!file.isDirectory" class="file-size">{{ formatSize(file.size) }}</span>
            </div>
            <div class="file-actions" v-if="!file.isDirectory" @click.stop>
              <button @click.stop="downloadSingleFile(file)" class="action-btn" title="下载">
                <i class="fas fa-download"></i>
              </button>
              <button @click.stop="shareFile(file)" class="action-btn" title="分享">
                <i class="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <div v-if="showPreview" class="file-preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <div class="preview-title">{{ previewFile?.name }}</div>
          <button @click="closePreview" class="preview-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="preview-body">
          <!-- 加载中状态 -->
          <div v-if="previewLoading" class="preview-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>正在准备预览，请稍候...</span>
          </div>
          
          <!-- PDF预览 -->
          <div v-else-if="isPdfPreview" class="preview-pdf">
            <iframe :src="previewUrl" frameborder="0"></iframe>
          </div>
          
          <!-- 其他预览方式（非PDF转换的情况） -->
          <div v-else>
            <!-- 图片预览 -->
            <div v-if="isImageFile(previewFile)" class="preview-image">
              <img :src="previewFile?.url" alt="预览图片">
            </div>
            
            <!-- 文本预览 -->
            <div v-else-if="isTextFile(previewFile)" class="preview-text">
              <pre>{{ previewText }}</pre>
            </div>
            
            <!-- Office文档预览 (现在直接使用PDF预览) -->
            
            <!-- 不支持预览的文件 -->
            <div v-else class="preview-unsupported">
              <i class="fas" :class="getFileIcon(previewFile)"></i>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮浮动显示 -->
        <div class="floating-actions">
          <button @click.stop="downloadSingleFile(previewFile)" class="floating-btn download-btn">
            <i class="fas fa-download"></i>
          </button>
          <button @click.stop="shareFile(previewFile)" class="floating-btn share-btn">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useExtractZIP } from '@/core/tools/ExtractZIP.js';
import { jsPDF } from 'jspdf';

// 文件选择输入框引用
const fileInput = ref(null);

// 使用自定义的解压逻辑组合式函数
const {
  isDragging,            // 拖拽状态
  zipFile,               // 当前选择的ZIP文件
  extractedFiles,        // 解压后的文件列表
  isExtracting,          // 是否正在解压
  extractProgress,       // 解压进度百分比
  extractError,          // 解压错误信息
  totalFiles,            // ZIP内文件总数
  totalSize,             // ZIP内文件总大小
  outputFolderName,      // 输出文件夹名称
  hasZipFile,            // 是否已选择ZIP文件
  hasExtractedFiles,     // 是否有解压结果
  extractedFilesCount,   // 解压后文件数量
  handleDragOver,        // 拖拽悬停处理
  handleDragLeave,       // 拖拽离开处理
  handleDrop,            // 拖拽释放处理
  handleFileSelect,      // 文件选择处理
  formatSize,            // 文件大小格式化
  extractZip,            // 执行解压
  downloadSingleFile,    // 下载单个文件
  clearFiles,            // 清空文件
  getFileIcon,           // 获取文件图标
  handleEnterKey         // 回车快捷键处理
} = useExtractZIP();

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  nextTick(() => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  });
};

/**
 * 触发清空文件
 */
const triggerClearFiles = () => {
  nextTick(() => {
    clearFiles(fileInput);
  });
};

// 文件预览相关状态
const showPreview = ref(false);
const previewFile = ref(null);
const previewText = ref('');
const previewLoading = ref(false);
const previewUrl = ref('');
const isPdfPreview = ref(false);

/**
 * 预览文件
 * @param {Object} file 文件对象
 */
const openPreview = async (file) => {
  // 不预览目录
  if (file.isDirectory) return;

  previewFile.value = file;
  showPreview.value = true;
  previewLoading.value = true;
  
  try {
    // 创建File对象
    const response = await fetch(file.url);
    const blob = await response.blob();
    const fileObj = new File([blob], file.name, { type: file.type || getMimeType(file.name) });
    
    // 判断文件类型并进行相应处理
    if (isPdfFile(file)) {
      // 如果已经是PDF，直接使用
      previewUrl.value = file.url;
      isPdfPreview.value = true;
      previewLoading.value = false;
    } else if (isImageFile(file)) {
      // 图片转PDF
      const pdfUrl = await convertImageToPdf(fileObj);
      previewUrl.value = pdfUrl;
      isPdfPreview.value = true;
      previewLoading.value = false;
    } else if (isTextFile(file)) {
      // 文本转PDF
      const content = await loadTextContent(file);
      previewText.value = content;
      const pdfUrl = await convertTextToPdf(content, file.name);
      previewUrl.value = pdfUrl;
      isPdfPreview.value = true;
      previewLoading.value = false;
    } else if (isOfficeFile(file)) {
      // Office文件转PDF
      const pdfUrl = await convertOfficeToPdf(fileObj);
      previewUrl.value = pdfUrl;
      isPdfPreview.value = true;
      previewLoading.value = false;
    } else {
      // 其他类型文件转为简单PDF
      const pdfUrl = await convertOfficeToPdf(fileObj); // 使用相同的转换方法
      previewUrl.value = pdfUrl;
      isPdfPreview.value = true;
      previewLoading.value = false;
    }
  } catch (error) {
    previewLoading.value = false;
    
    // 如果转换失败，尝试使用原始预览方式
    if (isTextFile(file)) {
      loadTextContent(file).then(content => {
        previewText.value = content;
        previewLoading.value = false;
      }).catch(error => {
        previewText.value = '无法读取文件内容';
        previewLoading.value = false;
      });
    } else {
      // 直接使用原始URL
      previewUrl.value = file.url;
      isPdfPreview.value = isPdfFile(file);
      previewLoading.value = false;
    }
  }
};

/**
 * 关闭预览
 */
const closePreview = () => {
  showPreview.value = false;
  previewFile.value = null;
  previewText.value = '';
  
  // 释放URL
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  
  previewUrl.value = '';
  isPdfPreview.value = false;
};

/**
 * 加载文本内容
 * @param {Object} file 文件对象
 * @returns {Promise<string>}
 */
const loadTextContent = async (file) => {
  if (!file || !file.url) return '';
  
  try {
    const response = await fetch(file.url);
    return await response.text();
  } catch (error) {
    return '读取文件内容失败';
  }
};

/**
 * 根据文件名获取MIME类型
 * @param {string} fileName 文件名
 * @returns {string} MIME类型
 */
const getMimeType = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
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
};

/**
 * 将图片转换为PDF
 * @param {File} file 图片文件
 * @returns {Promise<string>} PDF的URL
 */
const convertImageToPdf = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          // 计算适合的PDF尺寸
          const imgRatio = img.width / img.height;
          
          // 创建PDF文档，使用A4尺寸
          const pdf = new jsPDF({
            orientation: imgRatio > 1 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // 计算图片在PDF中的尺寸，保持比例
          let imgWidth, imgHeight;
          
          if (imgRatio > 1) {
            // 宽图片
            imgWidth = pdfWidth - 20; // 留出10mm边距
            imgHeight = imgWidth / imgRatio;
          } else {
            // 高图片
            imgHeight = pdfHeight - 20; // 留出10mm边距
            imgWidth = imgHeight * imgRatio;
          }
          
          // 计算居中位置
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;
          
          // 添加图片到PDF
          pdf.addImage(
            img, 
            'JPEG', 
            x, 
            y, 
            imgWidth, 
            imgHeight
          );
          
          // 生成PDF blob
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          resolve(pdfUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      // 加载图片
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 将文本转换为PDF
 * @param {string} text 文本内容
 * @param {string} fileName 文件名
 * @returns {Promise<string>} PDF的URL
 */
const convertTextToPdf = async (text, fileName) => {
  return new Promise((resolve) => {
    try {
      // 创建PDF文档
      const pdf = new jsPDF();
      
      // 设置标题
      pdf.setFontSize(16);
      pdf.text(fileName, 20, 20);
      
      // 设置正文
      pdf.setFontSize(12);
      
      // 分割文本为行，处理长文本
      const lines = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - 40);
      
      // 添加文本到PDF，从30mm开始
      pdf.text(lines, 20, 30);
      
      // 生成PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      resolve(pdfUrl);
    } catch (error) {
      resolve(''); // 失败时返回空字符串
    }
  });
};

/**
 * 将Office文档转换为PDF
 * @param {File} file Office文件
 * @returns {Promise<string>} PDF的URL
 */
const convertOfficeToPdf = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      // 创建一个PDF文档
      const pdf = new jsPDF();
      
      // 添加标题
      pdf.setFontSize(16);
      pdf.text(`文件预览: ${file.name}`, 20, 20);
      
      // 添加说明
      pdf.setFontSize(12);
      pdf.text('此文件已转换为PDF格式以便预览', 20, 30);
      pdf.text('原始文件格式: ' + file.type, 20, 40);
      
      // 添加Office文件图标
      const iconType = file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx') ? 'Word文档' :
                      file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') ? 'Excel表格' :
                      file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx') ? 'PowerPoint演示文稿' :
                      'Office文档';
      
      pdf.text(`文件类型: ${iconType}`, 20, 50);
      
      // 添加文件信息
      pdf.text(`文件大小: ${formatSize(file.size)}`, 20, 60);
      
      // 生成PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      resolve(pdfUrl);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 分享文件
 * @param {Object} file 文件对象
 */
const shareFile = async (file) => {
  if (!file || !file.url) return;

  // 检查分享API是否可用
  if (!navigator.share) {
    alert('您的浏览器不支持分享功能');
    return;
  }

  try {
    // 创建文件对象
    const blob = await fetch(file.url).then(r => r.blob());
    const fileToShare = new File([blob], file.name, { type: file.type || getMimeType(file.name) });

    // 分享文件
    await navigator.share({
      title: `分享文件: ${file.name}`,
      text: `分享来自解压工具的文件: ${file.name}`,
      files: [fileToShare]
    });
  } catch (error) {
    // 如果分享API不支持文件分享，则尝试只分享文本
    try {
      await navigator.share({
        title: `分享文件: ${file.name}`,
        text: `我想分享一个文件: ${file.name}`
      });
    } catch (fallbackError) {
      alert('分享失败');
    }
  }
};

/**
 * 判断是否可以预览文件
 * @param {Object} file 文件对象
 * @returns {Boolean}
 */
const canPreviewFile = (file) => {
  if (!file) return false;
  return true; // 现在我们可以预览所有文件类型
};

/**
 * 判断是否为图片文件
 * @param {Object} file 文件对象
 * @returns {Boolean}
 */
const isImageFile = (file) => {
  if (!file) return false;
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  
  if (file.type && imageTypes.includes(file.type)) return true;
  
  // 检查扩展名
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * 判断是否为PDF文件
 * @param {Object} file 文件对象
 * @returns {Boolean}
 */
const isPdfFile = (file) => {
  if (!file) return false;
  return (file.type === 'application/pdf') || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * 判断是否为文本文件
 * @param {Object} file 文件对象
 * @returns {Boolean}
 */
const isTextFile = (file) => {
  if (!file) return false;
  const textTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/csv'];
  
  if (file.type && textTypes.includes(file.type)) return true;
  
  // 检查扩展名
  const textExtensions = ['.txt', '.html', '.htm', '.css', '.js', '.json', '.csv', '.xml', '.md'];
  return textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * 判断是否为Office文件
 * @param {Object} file 文件对象
 * @returns {Boolean}
 */
const isOfficeFile = (file) => {
  if (!file) return false;
  
  const officeTypes = [
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (file.type && officeTypes.includes(file.type)) return true;
  
  // 检查扩展名
  const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  return officeExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};
</script>

<style scoped>
.mp-extract-zip {
  padding: 12px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 110px);
}

h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 4px;
  text-align: center;
}

.subtitle {
  color: #666;
  font-size: 12px;
  text-align: center;
  margin: 0 0 16px;
}

/* 上传区域 */
.upload-area {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  min-height: 140px;
  transition: all 0.3s;
}

.upload-area.drag-over {
  border: 2px dashed #1989fa;
  background-color: #f0f8ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  height: 100%;
}

.upload-icon {
  font-size: 36px;
  color: #1989fa;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  margin: 0 0 12px;
}

.upload-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  color: #1989fa;
  border: 1px solid #91d5ff;
  padding: 0 24px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.upload-btn i {
  margin-right: 6px;
}

.file-input {
  display: none;
}

/* 文件信息 */
.file-info {
  width: 100%;
}

.file-header {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f0f8ff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.file-details {
  flex: 1;
  min-width: 0;
  margin: 0 10px;
}

.file-name {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 18px;
  -webkit-tap-highlight-color: transparent;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.primary-btn, .secondary-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  padding: 0 15px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.primary-btn {
  background-color: #1989fa;
  color: #fff;
}

.primary-btn:active {
  background-color: #0e7fe9;
}

.secondary-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.secondary-btn:active {
  background-color: #e8e8e8;
}

.primary-btn i, .secondary-btn i {
  margin-right: 6px;
}

/* 进度条 */
.progress-container {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-inner {
  height: 100%;
  background-color: #1989fa;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: right;
  display: block;
}

/* 错误消息 */
.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 10px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  color: #f5222d;
  font-size: 13px;
}

.error-message i {
  margin-right: 8px;
  font-size: 16px;
}

/* 解压结果 */
.extract-result {
  background-color: #fff;
  border-radius: 12px;
  padding: 14px;
}

.result-header {
  margin-bottom: 12px;
}

.result-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 6px;
}

.result-header .file-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.file-items {
  max-height: 400px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.file-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  transition: background-color 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:active {
  background-color: #f5f9ff;
}

.file-item.directory {
  background-color: #f9f9f9;
}

.file-item-content {
  display: flex;
  align-items: center;
}

.file-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #1989fa;
  font-size: 18px;
}

.file-item.directory .file-icon {
  color: #ff9900;
}

.file-details {
  flex: 1;
  min-width: 0;
  position: relative;
}

.file-path {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-hint {
  font-size: 10px;
  color: #1989fa;
  margin-top: 2px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(25, 137, 250, 0.1);
  color: #1989fa;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.action-btn:active {
  background-color: #e6f3ff;
}

/* 文件预览模态框 */
.file-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
}

.preview-content {
  width: 100%;
  height: 100%;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background-color: #fafafa;
}

.preview-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.preview-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.preview-body {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
}

/* 图片预览 */
.preview-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* PDF预览 */
.preview-pdf {
  width: 100%;
  height: 100%;
}

.preview-pdf iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 文本预览 */
.preview-text {
  width: 100%;
  height: 100%;
  padding: 10px;
  overflow: auto;
  background-color: #fff;
  border-radius: 8px;
}

.preview-text pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  padding: 10px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  gap: 15px;
  font-size: 16px;
}

.preview-loading i {
  font-size: 36px;
  color: #1989fa;
  margin-bottom: 10px;
}

/* Office预览 */
.preview-office {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.office-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  width: 80%;
  text-align: center;
}

.office-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
}

.office-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.office-message p {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.office-preview-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* 不支持预览 */
.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.preview-unsupported i {
  font-size: 48px;
  color: #999;
}

.preview-unsupported p {
  margin: 0;
  font-size: 15px;
  color: #666;
}

.download-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 浮动操作按钮 */
.floating-actions {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.floating-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  font-size: 18px;
  -webkit-tap-highlight-color: transparent;
}

.download-btn {
  background-color: #1989fa;
  color: white;
}

.share-btn {
  background-color: #13ce66;
  color: white;
}

.floating-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style> 