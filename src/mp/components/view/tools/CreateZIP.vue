<template>
  <div class="tool-page">
    <!-- 头部 -->
    <div class="tool-hero">
      <div class="hero-icon">
        <van-icon name="bag-o" size="32" color="#f59e0b" />
      </div>
      <h1>创建压缩包</h1>
      <p>多文件一键打包</p>
    </div>

    <!-- 主内容区 -->
    <div class="tool-content">
      <!-- 文件列表区 -->
      <div class="files-card">
        <div class="card-header" v-if="hasFiles">
          <span class="file-count">{{ totalFiles }} 个文件</span>
          <span class="total-size">{{ formatSize(getTotalSize) }}</span>
        </div>

        <div v-if="hasFiles" class="file-list">
          <div v-for="(file, index) in files" :key="index" class="file-item">
            <div class="file-icon-wrap">
              <van-icon :name="getFileIconName(file)" size="20" />
            </div>
            <div class="file-meta">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
            </div>
            <div class="file-delete" @click="removeFile(index)">
              <van-icon name="cross" size="16" />
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <van-icon name="description" size="40" color="#d1d5db" />
          </div>
          <span>请添加文件</span>
        </div>

        <van-uploader multiple :after-read="handleFileSelect">
          <van-button round block plain type="primary" icon="plus" class="add-btn">
            添加文件
          </van-button>
        </van-uploader>
      </div>

      <!-- 操作区 -->
      <div class="action-card" v-if="hasFiles">
        <div class="name-input-wrap">
          <input 
            v-model="zipName" 
            type="text" 
            placeholder="输入压缩包名称" 
            class="name-input"
          />
          <span class="name-suffix">.zip</span>
        </div>

        <!-- 进度条 -->
        <div v-if="isCompressing" class="progress-wrap">
          <van-progress :percentage="compressionProgress" stroke-width="6" color="#f59e0b" />
          <span class="progress-text">{{ compressionProgress }}%</span>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-tip">
          <van-icon name="info-o" /> {{ errorMessage }}
        </div>

        <div class="action-buttons">
          <van-button 
            plain 
            round 
            @click="triggerClearFiles" 
            :disabled="isCompressing"
            class="clear-btn"
          >
            清空
          </van-button>
          <van-button 
            type="primary" 
            round 
            :loading="isCompressing" 
            loading-text="压缩中" 
            @click="handleCompressFiles"
            class="compress-btn"
          >
            生成压缩包
          </van-button>
        </div>
      </div>
    </div>

    <!-- 完成弹窗 -->
    <van-popup v-model:show="showResult" round position="bottom" :style="{ height: '40%' }">
      <div class="result-popup">
        <div class="result-icon">
          <van-icon name="passed" size="40" color="#10b981" />
        </div>
        <h3>压缩完成</h3>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalSize }}</span>
            <span class="stat-label">压缩前</span>
          </div>
          <div class="stat-arrow">
            <van-icon name="arrow" />
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ compressedSize }}</span>
            <span class="stat-label">压缩后</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value">{{ compressionRatio }}%</span>
            <span class="stat-label">压缩率</span>
          </div>
        </div>
        <van-button type="success" block round icon="down" @click="downloadZip" class="download-btn">
          下载压缩包
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showToast, showDialog } from 'vant';
import { useZipCompressor } from '@/core/tools/CreateZIP.js';

const showResult = ref(false);

const {
  files,
  zipName,
  isCompressing,
  compressedSize,
  totalSize,
  compressionRatio,
  compressionProgress,
  errorMessage,
  hasFiles,
  totalFiles,
  getTotalSize,
  removeFile,
  formatSize,
  compressFiles,
  downloadZip: coreDownloadZip,
  clearFiles: coreClearFiles
} = useZipCompressor();

// 适配 van-uploader 的文件选择
const handleFileSelect = (fileOrFiles) => {
  const newFiles = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  const rawFiles = newFiles.map(item => item.file);
  
  rawFiles.forEach(file => {
    if (!files.value.some(f => f.name === file.name && f.size === file.size)) {
      files.value.push(file);
    }
  });
};

const getFileIconName = (file) => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) return 'photo-o';
  if (name.endsWith('.pdf')) return 'description';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'orders-o';
  return 'file-text-o';
};

const triggerClearFiles = () => {
  showDialog({
    title: '提示',
    message: '确定要清空所有文件吗？',
    showCancelButton: true,
  }).then(() => {
    coreClearFiles(null);
  }).catch(() => {});
};

const handleCompressFiles = async () => {
  if (!zipName.value) {
    showToast('请输入压缩包名称');
    return;
  }
  try {
    await compressFiles();
    showResult.value = true;
  } catch (error) {
    showToast('压缩失败');
  }
};

const downloadZip = () => {
  coreDownloadZip();
  showResult.value = false;
  showToast('下载成功');
};
</script>

<style scoped>
.tool-page {
  min-height: calc(100vh - 96px);
  background: #fff;
  padding-bottom: 20px;
}

/* 头部 */
.tool-hero {
  text-align: center;
  padding: 40px 20px 30px;
  background: linear-gradient(180deg, #fffbeb 0%, #fff 100%);
}

.hero-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #fff;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
}

.tool-hero h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.tool-hero p {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

/* 主内容 */
.tool-content {
  padding: 0 16px;
}

/* 文件卡片 */
.files-card,
.action-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.file-count {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.total-size {
  font-size: 13px;
  color: #9ca3af;
}

/* 文件列表 */
.file-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 8px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-icon-wrap {
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  margin-right: 12px;
}

.file-meta {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #9ca3af;
}

.file-delete {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  border-radius: 50%;
  transition: all 0.2s;
}

.file-delete:active {
  background: #fee2e2;
  color: #dc2626;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 14px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: #f9fafb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn {
  margin-top: 4px;
}

.files-card :deep(.van-uploader) {
  width: 100%;
}

.files-card :deep(.van-uploader__wrapper) {
  justify-content: center;
}

/* 操作区 */
.name-input-wrap {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border-radius: 10px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.name-input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #374151;
  outline: none;
}

.name-input::placeholder {
  color: #9ca3af;
}

.name-suffix {
  font-size: 14px;
  color: #6b7280;
}

/* 进度 */
.progress-wrap {
  margin-bottom: 16px;
}

.progress-text {
  text-align: center;
  font-size: 13px;
  color: #f59e0b;
  margin-top: 8px;
}

/* 错误提示 */
.error-tip {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.clear-btn {
  flex: 1;
  height: 44px;
}

.compress-btn {
  flex: 2;
  height: 44px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
}

/* 结果弹窗 */
.result-popup {
  padding: 30px 20px;
  text-align: center;
}

.result-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-popup h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #1f2937;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item.highlight .stat-value {
  color: #10b981;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-arrow {
  color: #d1d5db;
}

.download-btn {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}
</style>
