<template>
  <div class="mp-create-zip">
    <h2>制作压缩包</h2>
    <p class="subtitle">支持文件和文件夹的批量压缩</p>

    <!-- 上传区域 -->
    <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" :class="{ 'drag-over': isDragging }">
      <div class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <p class="upload-text">点击或拖拽添加文件</p>
        <div class="upload-buttons">
          <button @click="triggerSelectFiles" class="upload-btn">
            <i class="fas fa-file-upload"></i> 添加文件
          </button>
          <button @click="triggerSelectDirectory" class="upload-btn">
            <i class="fas fa-folder-plus"></i> 添加文件夹
          </button>
        </div>
      </div>
      <input type="file" ref="fileInput" @change="handleFileSelect" multiple :webkitdirectory="isSelectingDirectory"
        :directory="isSelectingDirectory" class="file-input">
    </div>

    <!-- 文件列表 -->
    <div v-if="hasFiles" class="file-list">
      <div class="file-list-header">
        <h3>文件列表</h3>
        <div class="file-info">
          <span class="file-count">{{ totalFiles }}个项目</span>
          <span class="total-size">总大小：{{ formatSize(getTotalSize) }}</span>
        </div>
      </div>

      <div class="file-items">
        <div v-for="(file, index) in files" :key="file.name" class="file-item">
          <div class="file-item-content">
            <div class="file-icon">
              <i class="fas" :class="getFileIcon(file)"></i>
            </div>
            <div class="file-details">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
            </div>
            <button @click="removeFile(index)" class="remove-btn">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 压缩设置 -->
      <div class="compression-settings">
        <div class="zip-name-input">
          <input type="text" v-model="zipName" placeholder="压缩包名称" @keyup="handleEnterKey">
          <span class="zip-extension">.zip</span>
        </div>

        <!-- 进度条 -->
        <div v-if="isCompressing" class="progress-container">
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${compressionProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ compressionProgress }}%</span>
        </div>

        <div class="button-group">
          <button @click="handleCompressFiles" :disabled="!hasFiles || isCompressing" class="primary-btn">
            <i class="fas" :class="isCompressing ? 'fa-spinner fa-spin' : 'fa-file-archive'"></i>
            {{ isCompressing ? '正在制作...' : '制作压缩包' }}
          </button>
          <button @click="triggerClearFiles" class="secondary-btn">
            <i class="fas fa-trash-alt"></i>
            清空
          </button>
        </div>
      </div>
    </div>

    <!-- 压缩结果 -->
    <div v-if="compressedFile" class="result-panel">
      <div class="result-card">
        <div class="result-header">
          <i class="fas fa-check-circle"></i>
          <h3>压缩包制作完成</h3>
        </div>
        <div class="result-info">
          <div class="info-item">
            <span class="label">原始大小</span>
            <span class="value">{{ totalSize }}</span>
          </div>
          <div class="info-item">
            <span class="label">压缩大小</span>
            <span class="value">{{ compressedSize }}</span>
          </div>
          <div class="info-item highlight">
            <span class="label">压缩率</span>
            <span class="value">{{ compressionRatio }}%</span>
          </div>
        </div>
        <button @click="downloadZip" class="download-btn">
          <i class="fas fa-download"></i> 下载压缩文件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useZipCompressor } from '@/core/tools/CreateZIP.js';

// 文件选择输入框引用
const fileInput = ref(null);

// 使用自定义的压缩逻辑组合式函数
const {
  isDragging,           // 拖拽状态
  files,                // 已选择的文件列表
  zipName,              // 压缩包名称
  isCompressing,        // 是否正在压缩
  compressedFile,       // 压缩后生成的文件对象
  compressedSize,       // 压缩后文件大小
  totalSize,            // 原始文件总大小
  compressionRatio,     // 压缩率
  compressionProgress,  // 压缩进度
  isSelectingDirectory, // 是否选择文件夹
  hasFiles,             // 是否有文件
  totalFiles,           // 文件总数
  getTotalSize,         // 获取总大小方法
  selectFiles,          // 选择文件方法
  selectDirectory,      // 选择文件夹方法
  handleDragOver,       // 拖拽悬停处理
  handleDragLeave,      // 拖拽离开处理
  handleDrop,           // 拖拽释放处理
  handleFileSelect,     // 文件选择处理
  removeFile,           // 移除文件
  getFileIcon,          // 获取文件图标
  formatSize,           // 文件大小格式化
  compressFiles,        // 执行压缩
  downloadZip,          // 下载压缩包
  clearFiles,           // 清空文件
  handleEnterKey        // 回车快捷键处理
} = useZipCompressor();

/**
 * 触发文件选择
 */
const triggerSelectFiles = () => {
  nextTick(() => {
    selectFiles(fileInput);
  });
};

/**
 * 触发文件夹选择
 */
const triggerSelectDirectory = () => {
  nextTick(() => {
    selectDirectory(fileInput);
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

/**
 * 执行压缩操作
 */
const handleCompressFiles = async () => {
  try {
    await compressFiles();
  } catch (error) {
    // 压缩失败处理
  }
};
</script>

<style scoped>
.mp-create-zip {
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

.upload-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 300px;
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
  flex: 1;
}

.upload-btn i {
  margin-right: 6px;
}

.file-input {
  display: none;
}

/* 文件列表 */
.file-list {
  background-color: #fff;
  border-radius: 12px;
  padding: 14px;
}

.file-list-header {
  margin-bottom: 12px;
}

.file-list-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 6px;
}

.file-info {
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

.file-details {
  flex: 1;
  min-width: 0;
  position: relative;
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
  width: 32px;
  height: 32px;
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

/* 压缩设置 */
.compression-settings {
  margin-top: 16px;
}

.zip-name-input {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.zip-name-input input {
  flex: 1;
  height: 40px;
  border: none;
  background: none;
  padding: 0 12px;
  font-size: 14px;
}

.zip-extension {
  padding: 0 12px;
  color: #666;
  font-size: 14px;
  background-color: #f5f5f5;
  height: 40px;
  display: flex;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 10px;
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

/* 结果面板 */
.result-panel {
  margin-top: 12px;
}

.result-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 14px;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.result-header i {
  font-size: 20px;
  color: #52c41a;
  margin-right: 8px;
}

.result-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.result-info {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item.highlight .value {
  color: #1989fa;
}

.download-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: #fff;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.download-btn i {
  margin-right: 6px;
}

/* 进度条样式 */
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
</style> 