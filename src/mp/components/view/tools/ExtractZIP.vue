<template>
  <div class="tool-page">
    <!-- 头部 -->
    <div class="tool-hero">
      <div class="hero-icon">
        <van-icon name="gift-o" size="32" color="#22c55e" />
      </div>
      <h1>解压缩包</h1>
      <p>快速提取文件</p>
    </div>

    <!-- 主内容区 -->
    <div class="tool-content">
      <!-- 上传区域 -->
      <div class="upload-card" v-if="!hasZipFile">
        <van-uploader accept=".zip,application/zip,application/x-zip-compressed" :after-read="handleFileSelect">
          <div class="upload-trigger">
            <div class="upload-icon-wrap">
              <van-icon name="bag-o" size="28" color="#9ca3af" />
            </div>
            <span class="upload-text">点击选择 ZIP 文件</span>
            <span class="upload-hint">仅支持无密码压缩包</span>
          </div>
        </van-uploader>
      </div>

      <!-- 文件信息卡片 -->
      <div class="file-card" v-if="hasZipFile">
        <div class="file-info-row">
          <div class="file-icon-wrap">
            <van-icon name="orders-o" size="24" color="#22c55e" />
          </div>
          <div class="file-meta">
            <span class="file-name">{{ zipFile.name }}</span>
            <span class="file-size">{{ formatSize(zipFile.size) }}</span>
          </div>
          <div class="file-remove" @click="triggerClearFiles">
            <van-icon name="cross" size="16" />
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="isExtracting" class="progress-wrap">
          <van-progress :percentage="extractProgress" stroke-width="6" color="#22c55e" />
          <span class="progress-text">{{ extractProgress }}%</span>
        </div>

        <!-- 错误提示 -->
        <div v-if="extractError" class="error-tip">
          <van-icon name="info-o" /> {{ extractError }}
        </div>

        <!-- 操作按钮 -->
        <van-button 
          v-if="!isExtracting && !hasExtractedFiles" 
          type="primary" 
          block 
          round 
          @click="extractZip"
          class="extract-btn"
        >
          开始解压
        </van-button>
      </div>

      <!-- 解压结果 -->
      <div class="result-card" v-if="hasExtractedFiles">
        <div class="result-header">
          <div class="result-title">
            <span class="count">{{ extractedFilesCount }}</span> 个文件
          </div>
          <van-button plain round size="small" type="success" icon="down" @click="downloadAllFiles">
            全部下载
          </van-button>
        </div>

        <div class="file-list">
          <div 
            v-for="(file, index) in extractedFiles" 
            :key="`${file.path}-${index}`" 
            class="file-item"
          >
            <div class="item-icon" :class="{ folder: file.isDirectory }">
              <van-icon :name="getFileIconName(file)" size="18" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ file.name }}</span>
              <span class="item-size" v-if="!file.isDirectory">{{ formatSize(file.size) }}</span>
            </div>
            <van-button 
              v-if="!file.isDirectory" 
              size="mini" 
              plain 
              round
              @click="downloadSingleFile(file)"
            >
              下载
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showDialog, showToast } from 'vant';
import { useExtractZIP } from '@/core/tools/ExtractZIP.js';

const {
  zipFile,
  extractedFiles,
  isExtracting,
  extractProgress,
  extractError,
  totalSize,
  hasZipFile,
  hasExtractedFiles,
  extractedFilesCount,
  handleFileSelect: coreHandleFileSelect,
  formatSize,
  extractZip: coreExtractZip,
  downloadSingleFile: coreDownloadSingleFile,
  clearFiles: coreClearFiles
} = useExtractZIP();

// 包装解压方法，添加提示
const extractZip = async () => {
  await coreExtractZip();
  if (hasExtractedFiles.value && !extractError.value) {
    showToast('解压成功');
  }
};

// 包装下载单个文件方法
const downloadSingleFile = (file) => {
  coreDownloadSingleFile(file);
  showToast(`正在下载 ${file.name}`);
};

// 下载全部文件
const downloadAllFiles = () => {
  const filesToDownload = extractedFiles.value.filter(f => !f.isDirectory);
  if (filesToDownload.length === 0) {
    showToast('没有可下载的文件');
    return;
  }
  
  filesToDownload.forEach((file, index) => {
    setTimeout(() => {
      coreDownloadSingleFile(file);
    }, index * 200); // 错开下载时间避免浏览器拦截
  });
  
  showToast(`正在下载 ${filesToDownload.length} 个文件`);
};

// 适配 van-uploader
const handleFileSelect = (file) => {
  // van-uploader 返回 { file: File, content: ... }
  // 核心逻辑期望 event.target.files 或直接传 file 对象
  
  const mockEvent = {
    target: {
      files: [file.file]
    }
  };
  coreHandleFileSelect(mockEvent);
};

const getFileIconName = (file) => {
  if (file.isDirectory) return 'folder-o';
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.png')) return 'photo-o';
  if (name.endsWith('.pdf')) return 'description';
  return 'file-text-o';
};

const triggerClearFiles = () => {
  showDialog({
    title: '提示',
    message: '确定要移除当前文件吗？',
    showCancelButton: true,
  }).then(() => {
    coreClearFiles(null);
    showToast('已清除');
  }).catch(() => {});
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
  background: linear-gradient(180deg, #f0fdf4 0%, #fff 100%);
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
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
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

/* 上传卡片 */
.upload-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  border: 2px dashed #e5e7eb;
  transition: all 0.3s;
}

.upload-card :deep(.van-uploader) {
  width: 100%;
}

.upload-card :deep(.van-uploader__wrapper) {
  justify-content: center;
}

.upload-card:active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon-wrap {
  width: 56px;
  height: 56px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* 文件卡片 */
.file-card,
.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  margin-bottom: 16px;
}

.file-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.file-icon-wrap {
  width: 44px;
  height: 44px;
  background: #f0fdf4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.file-meta {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 13px;
  color: #9ca3af;
}

.file-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  border-radius: 50%;
}

.file-remove:active {
  background: #fee2e2;
  color: #dc2626;
}

/* 进度 */
.progress-wrap {
  margin-bottom: 16px;
}

.progress-text {
  text-align: center;
  font-size: 13px;
  color: #22c55e;
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

.extract-btn {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
}

/* 结果卡片 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.result-title {
  font-size: 14px;
  color: #6b7280;
}

.result-title .count {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

/* 文件列表 */
.file-list {
  max-height: 300px;
  overflow-y: auto;
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

.item-icon {
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  margin-right: 10px;
}

.item-icon.folder {
  color: #f59e0b;
}

.item-info {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.item-name {
  display: block;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-size {
  font-size: 12px;
  color: #9ca3af;
}
</style>
