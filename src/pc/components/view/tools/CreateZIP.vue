<template>
  <div class="file-compressor">
    <div class="compressor-header">
      <h2>制作压缩包</h2>
      <p class="subtitle">支持文件和文件夹的批量压缩</p>
    </div>

    <div class="compressor-container">
      <div class="main-panel">
        <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave" :class="{ 'drag-over': isDragging }">
          <div class="upload-area">
            <div class="upload-placeholder" v-if="!hasFiles">
              <i class="fas fa-cloud-upload-alt upload-icon"></i>
              <p class="upload-text">拖拽或点击添加文件/文件夹</p>
            </div>

            <div class="upload-buttons">
              <button @click="triggerSelectFiles" class="upload-btn file-btn">
                <div class="btn-content">
                  <div class="icon-wrapper">
                    <i class="fas fa-file-upload"></i>
                  </div>
                  <div class="btn-text">
                    <span class="primary-text">添加文件</span>
                  </div>
                </div>
                <div class="btn-background"></div>
              </button>
              <button @click="triggerSelectDirectory" class="upload-btn folder-btn">
                <div class="btn-content">
                  <div class="icon-wrapper">
                    <i class="fas fa-folder-plus"></i>
                  </div>
                  <div class="btn-text">
                    <span class="primary-text">添加文件夹</span>
                  </div>
                </div>
                <div class="btn-background"></div>
              </button>
            </div>

            <div v-if="hasFiles" class="file-list">
              <div class="file-list-header">
                <div class="header-left">
                  <h3>文件列表</h3>
                  <span class="file-count">{{ totalFiles }} 个项目</span>
                </div>
                <div class="total-size">总大小：{{ formatSize(getTotalSize) }}</div>
              </div>
              <div class="file-items">
                <TransitionGroup name="file-list">
                  <div v-for="(file, index) in files" :key="file.name" class="file-item">
                    <div class="file-item-content">
                      <div class="file-icon">
                        <i class="fas" :class="getFileIcon(file)"></i>
                      </div>
                      <div class="file-details">
                        <span class="file-name" :title="file.name">{{ file.name }}</span>
                        <span class="file-size">{{ formatSize(file.size) }}</span>
                      </div>
                      <button @click="removeFile(index)" class="remove-btn" title="移除">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <div v-if="isCompressing" class="progress-bar">
                      <div class="progress-inner"></div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </div>
          <input type="file" ref="fileInput" @change="handleFileSelect" multiple :webkitdirectory="isSelectingDirectory"
            :directory="isSelectingDirectory" class="file-input">
        </div>

        <div v-if="hasFiles" class="action-panel">
          <div class="compression-settings">
            <div class="zip-name-input">
              <input type="text" v-model="zipName" placeholder="压缩包名称" @keyup="handleEnterKey">
              <span class="zip-extension">.zip</span>
            </div>

            <div class="action-buttons">
              <button @click="handleCompressFiles" :disabled="!hasFiles || isCompressing" class="action-btn primary">
                <i class="fas" :class="isCompressing ? 'fa-spinner fa-spin' : 'fa-file-archive'"></i>
                {{ isCompressing ? '正在制作...' : '制作压缩包' }}
              </button>
              <button @click="triggerClearFiles" class="action-btn danger">
                <i class="fas fa-trash-alt"></i>
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <Transition name="fade">
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
            <button @click="downloadZip" class="action-btn success full-width">
              <i class="fas fa-download"></i> 下载压缩文件
            </button>
          </div>
        </div>
      </Transition>
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
    // 如果组件中有消息提示系统，可以在这里处理错误
    console.error(error);
  }
};
</script>

<style scoped>
/* 基础样式 */
.file-compressor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 标题样式 */
.compressor-header {
  text-align: center;
  margin-bottom: 30px;
}

.compressor-header h2 {
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
.compressor-container {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.main-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
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
  gap: 30px;
}

/* 上传占位符 */
.upload-placeholder {
  color: #666;
  width: 100%;
  text-align: center;
}

.upload-icon {
  font-size: 64px;
  color: #2196f3;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.upload-text {
  font-size: 20px;
  margin: 15px 0;
  color: #2c3e50;
}

.file-input {
  display: none;
}

/* 上传按钮 */
.upload-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 0 20px;
}

.upload-btn {
  position: relative;
  width: 220px;
  height: 64px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  transition: all 0.3s ease;
}

.file-btn .btn-background {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

.folder-btn .btn-background {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
}

.btn-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 16px;
  color: white;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.icon-wrapper i {
  font-size: 16px;
  line-height: 1;
}

.btn-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  height: 100%;
}

.primary-text {
  font-size: 14px;
  font-weight: 600;
  color: white;
  line-height: 1.2;
  margin: 0;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
}

.upload-btn:hover .icon-wrapper {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.25);
}

/* 文件列表 */
.file-list {
  width: 100%;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.file-items {
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
}

.file-item {
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.2s;
  border: 1px solid #eee;
  overflow: hidden;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.file-item-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f8fe;
}

.file-icon i {
  color: #2196f3;
  font-size: 20px;
}

.file-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #666;
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

/* 进度条 */
.progress-bar {
  height: 2px;
  background: #f0f0f0;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: #2196f3;
  width: 30%;
  animation: progress 1s infinite linear;
  transform-origin: 0 50%;
}

@keyframes progress {
  0% { transform: translateX(0) scaleX(0); }
  40% { transform: translateX(0) scaleX(0.4); }
  100% { transform: translateX(100%) scaleX(0.4); }
}

/* 操作面板 */
.action-panel {
  margin-top: 20px;
}

.compression-settings {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* 输入框 */
.zip-name-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.zip-name-input input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  width: 100%;
}

.zip-name-input input:focus {
  border-color: #2196f3;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.zip-extension {
  color: #666;
  font-size: 15px;
  padding: 12px 0;
}

/* 按钮 */
.action-buttons {
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

.action-btn.success {
  background: #4caf50;
  color: white;
}

.action-btn.success:hover {
  background: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.action-btn.full-width {
  width: 100%;
}

/* 结果面板 */
.result-panel {
  width: 300px;
  position: sticky;
  top: 20px;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.result-header {
  text-align: center;
  margin-bottom: 25px;
}

.result-header i {
  font-size: 48px;
  color: #4caf50;
  margin-bottom: 15px;
}

.result-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.result-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item.highlight {
  color: #2196f3;
  font-weight: 600;
  font-size: 18px;
}

/* 动画 */
.file-list-enter-active,
.file-list-leave-active {
  transition: all 0.3s ease;
}

.file-list-enter-from,
.file-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .compressor-container {
    flex-direction: column;
  }

  .result-panel {
    width: 100%;
    position: static;
  }

  .action-buttons, .upload-buttons {
    flex-direction: column;
    gap: 12px;
  }

  .upload-btn {
    width: 100%;
    height: 56px;
  }

  .btn-content {
    padding: 0 12px;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .icon-wrapper i {
    font-size: 14px;
  }

  .primary-text {
    font-size: 13px;
  }
}
</style>