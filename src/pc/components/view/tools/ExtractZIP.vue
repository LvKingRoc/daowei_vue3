<template>
  <div class="zip-extractor">
    <div class="extractor-header">
      <h2>解压压缩包</h2>
      <p class="subtitle">支持解压ZIP格式压缩包，仅支持无密码解压，有密码的压缩包无法解压</p>
    </div>

    <div class="extractor-container">
      <div class="main-panel">
        <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave" :class="{ 'drag-over': isDragging }">
          <div class="upload-area">
            <div v-if="!hasZipFile" class="upload-placeholder">
              <i class="fas fa-file-archive upload-icon"></i>
              <p class="upload-text">拖拽或点击上传ZIP文件</p>
              <button @click="triggerFileInput" class="upload-btn">
                <i class="fas fa-upload"></i>
                选择文件
              </button>
            </div>

            <div v-if="zipFile" class="file-info">
              <div class="file-header">
                <i class="fas fa-file-archive file-icon"></i>
                <div class="file-details">
                  <span class="file-name">{{ zipFile.name }}</span>
                  <span class="file-size">{{ formatSize(zipFile.size) }}</span>
                </div>
                <button @click="triggerClearFiles" class="remove-btn" title="移除">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="action-buttons">
                <div class="button-group">
                  <button @click="extractZip" :disabled="isExtracting" class="action-btn primary">
                    <i class="fas" :class="isExtracting ? 'fa-spinner fa-spin' : 'fa-file-export'"></i>
                    {{ isExtracting ? '正在解压...' : '解压文件' }}
                  </button>
                  <button @click="triggerClearFiles" class="action-btn danger">
                    <i class="fas fa-trash-alt"></i>
                    清空
                  </button>
                </div>
              </div>

              <div v-if="isExtracting" class="progress-container">
                <div class="progress-bar">
                  <div class="progress-inner" :style="{ width: `${extractProgress}%` }"></div>
                </div>
                <span class="progress-text">{{ extractProgress }}%</span>
              </div>

              <div v-if="extractError" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ extractError }}</span>
              </div>
            </div>
          </div>
          <input type="file" ref="fileInput" @change="handleFileSelect" accept=".zip,application/zip,application/x-zip-compressed" class="file-input">
        </div>

        <div v-if="hasExtractedFiles" class="extracted-files-panel">
          <div class="panel-header">
            <div class="header-left">
              <h3>解压结果</h3>
              <span class="file-count">{{ extractedFilesCount }} 个文件</span>
            </div>
            <div class="total-size">总大小：{{ formatSize(totalSize) }}</div>
          </div>

          <div class="files-container">
            <div class="file-list">
              <div v-for="(file, index) in extractedFiles" :key="`${file.path}/${file.name}-${index}`" class="file-item"
                :class="{ 'directory': file.isDirectory }">
                <div class="file-item-content">
                  <div class="file-icon">
                    <i class="fas" :class="getFileIcon(file)"></i>
                  </div>
                  <div class="file-details">
                    <span class="file-name" :title="file.name">{{ file.name }}</span>
                    <span v-if="file.path" class="file-path">{{ file.path }}</span>
                    <span v-if="!file.isDirectory" class="file-size">{{ formatSize(file.size) }}</span>
                  </div>
                  <div class="file-actions" v-if="!file.isDirectory">
                    <button @click="downloadSingleFile(file)" class="download-btn" title="下载此文件">
                      <i class="fas fa-download"></i>
                      下载
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useExtractZIP } from '@/core/tools/ExtractZIP.js';

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
</script>

<style scoped>
/* 基础样式 */
.zip-extractor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 标题样式 */
.extractor-header {
  text-align: center;
  margin-bottom: 30px;
}

.extractor-header h2 {
  color: #2c3e50;
  margin: 0 0 10px;
  font-weight: 600;
  font-size: 32px;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

/* 布局 */
.extractor-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.main-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 拖放区域 */
.drop-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 16px;
  padding: 30px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.drop-zone:hover,
.drag-over {
  border-color: #2196f3;
  background-color: #f1f8fe;
}

.upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 上传占位符 */
.upload-placeholder {
  color: #666;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 64px;
  color: #2196f3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.upload-text {
  font-size: 20px;
  margin: 0;
  color: #2c3e50;
}

.file-input {
  display: none;
}

/* 上传按钮 */
.upload-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: #2196f3;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.upload-btn:hover {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

/* 文件信息 */
.file-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.file-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.file-icon {
  font-size: 24px;
  color: #2196f3;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f8fe;
  border-radius: 8px;
}

.file-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #666;
  font-size: 14px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff5252;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  opacity: 0.6;
}

.remove-btn:hover {
  background: #fee;
  opacity: 1;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.action-btn.primary {
  background: #2196f3;
  color: white;
  flex: 2;
}

.action-btn.primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.action-btn.primary:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn.danger {
  background: #ff5252;
  color: white;
  flex: 1;
}

.action-btn.danger:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
}

/* 进度条 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: #2196f3;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #2196f3;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ff5252;
  background: #fee;
  padding: 12px;
  border-radius: 8px;
}

.error-message i {
  font-size: 16px;
}

/* 解压结果面板 */
.extracted-files-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.file-count {
  color: #666;
  font-size: 14px;
  background: #f1f8fe;
  padding: 4px 12px;
  border-radius: 12px;
}

.total-size {
  color: #666;
  font-size: 14px;
}

/* 文件列表 */
.files-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.file-list {
  display: flex;
  flex-direction: column;
}

.file-item {
  border-bottom: 1px solid #eee;
  transition: all 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background: #f9f9f9;
}

.file-item.directory {
  background: #f5f5f5;
}

.file-item-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.file-path {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  align-items: center;
}

.download-btn {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.download-btn:hover {
  background: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
    gap: 12px;
  }

  .action-btn {
    width: 100%;
  }

  .file-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style> 