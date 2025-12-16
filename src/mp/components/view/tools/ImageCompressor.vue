<template>
  <div class="tool-page">
    <!-- 头部 -->
    <div class="tool-hero">
      <div class="hero-icon">
        <van-icon name="photo-o" size="32" color="#4f46e5" />
      </div>
      <h1>图片压缩</h1>
      <p>智能压缩，保持清晰</p>
    </div>

    <!-- 主内容区 -->
    <div class="tool-content">
      <!-- 上传区域 -->
      <div class="upload-card" v-if="!previewImage">
        <van-uploader :after-read="afterRead" accept="image/*">
          <div class="upload-trigger">
            <div class="upload-icon-wrap">
              <van-icon name="plus" size="28" color="#9ca3af" />
            </div>
            <span class="upload-text">点击选择图片</span>
            <span class="upload-hint">JPG / PNG / GIF / WebP</span>
          </div>
        </van-uploader>
      </div>

      <!-- 预览区域 -->
      <div class="preview-card" v-if="previewImage">
        <div class="image-preview" @click="showImagePreview([previewImage])">
          <van-image :src="previewImage" fit="contain" class="preview-img" />
        </div>
        <div class="preview-info">
          <span class="info-label">原始大小</span>
          <span class="info-value">{{ originalSize }}</span>
        </div>
        <van-button plain size="small" type="default" icon="cross" @click="clearImage" class="clear-btn">
          移除
        </van-button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-tip">
        <van-icon name="info-o" /> {{ errorMessage }}
      </div>

      <!-- 压缩设置 -->
      <div class="settings-card" v-if="previewImage">
        <div class="card-title">压缩设置</div>
        <div class="setting-row">
          <span class="setting-label">目标大小</span>
          <div class="setting-control">
            <van-stepper v-model="targetSize" :min="1" :max="maxSize" integer button-size="28px" />
            <div class="unit-switch">
              <span :class="{ active: sizeUnit === 'KB' }" @click="sizeUnit = 'KB'">KB</span>
              <span :class="{ active: sizeUnit === 'MB' }" @click="sizeUnit = 'MB'">MB</span>
            </div>
          </div>
        </div>
        <van-button 
          type="primary" 
          block 
          round 
          :loading="loading" 
          loading-text="压缩中..." 
          @click="compressImage"
          class="compress-btn"
        >
          开始压缩
        </van-button>
      </div>

      <!-- 压缩结果 -->
      <div class="result-card" v-if="compressedImage">
        <div class="card-title">压缩结果</div>
        <div class="result-preview" @click="showImagePreview([compressedImage])">
          <van-image :src="compressedImage" fit="contain" class="result-img" />
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">{{ compressedSize }}</span>
            <span class="stat-label">压缩后</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value highlight">{{ compressionRatio }}%</span>
            <span class="stat-label">压缩率</span>
          </div>
        </div>
        <van-button type="success" block round icon="down" @click="downloadImage" class="download-btn">
          下载图片
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { showImagePreview, showToast } from 'vant';
import { useImageCompressor } from '@/core/tools/ImageCompressor.js';

const loading = ref(false);
// 根据单位动态计算 stepper 的最大值
const maxSize = computed(() => sizeUnit.value === 'MB' ? 100 : 10000);

const {
  previewImage,
  compressedImage,
  targetSize,
  sizeUnit,
  originalSize,
  compressedSize,
  compressionRatio,
  errorMessage,
  handleFileSelect,
  compressImage: executeCompression,
  downloadImage,
  clearImage,
} = useImageCompressor();

const afterRead = (file) => {
  // Vant uploader returns an object { file, content, ... } or array of objects
  // We need the raw file object
  const rawFile = file.file;
  // Simulate event object expected by handleFileSelect or call processFile directly if exposed
  // Since useImageCompressor exposes handleFileSelect which expects an event, 
  // let's look at how to adapt.
  // Actually handleFileSelect expects an event with target.files.
  // We can bypass handleFileSelect and directly process if we had access to processFile,
  // but it is not returned.
  // However, handleFileSelect is just a wrapper.
  // Let's check if we can mock the event.
  const mockEvent = {
    target: {
      files: [rawFile]
    }
  };
  handleFileSelect(mockEvent);
};

const compressImage = async () => {
  loading.value = true;
  try {
    await executeCompression();
    if (compressedImage.value) {
      showToast('压缩成功');
    }
  } catch (error) {
    showToast('压缩失败，请重试');
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.tool-page {
  min-height: calc(100vh - 96px);
  background: #fff;
  padding-bottom: 20px;
}

/* 头部样式 */
.tool-hero {
  text-align: center;
  padding: 40px 20px 30px;
  background: linear-gradient(180deg, #f8f7ff 0%, #fff 100%);
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
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.15);
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

/* 主内容区 */
.tool-content {
  padding: 0 16px;
}

/* 上传卡片 */
.upload-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
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
  border-color: #4f46e5;
  background: #faf9ff;
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

/* 预览卡片 */
.preview-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  position: relative;
}

.image-preview {
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
}

.preview-img {
  width: 100%;
  height: 180px;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
}

.info-value {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.clear-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 20px;
  font-size: 12px;
}

/* 错误提示 */
.error-tip {
  margin: 16px 0;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 设置卡片 */
.settings-card,
.result-card {
  margin-top: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.setting-label {
  font-size: 14px;
  color: #6b7280;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unit-switch {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.unit-switch span {
  padding: 6px 12px;
  font-size: 13px;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.unit-switch span.active {
  background: #fff;
  color: #4f46e5;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.compress-btn {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
}

/* 结果卡片 */
.result-preview {
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  margin-bottom: 16px;
}

.result-img {
  width: 100%;
  height: 160px;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-value.highlight {
  color: #4f46e5;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #e5e7eb;
  margin: 0 20px;
}

.download-btn {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}
</style>
