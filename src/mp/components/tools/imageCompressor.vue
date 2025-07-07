<template>
  <div class="mp-image-compressor">
    <h2>图片压缩工具</h2>
    <p class="subtitle">支持所有图片格式</p>

    <!-- 上传区域 -->
    <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" @click="triggerFileInput" :class="{ 'drag-over': isDragging }">
      <div v-if="!previewImage" class="upload-placeholder">
        <i class="el-icon-upload upload-icon"></i>
        <p class="upload-text">点击或拖拽上传图片</p>
      </div>
      <div v-else class="preview-container">
        <img :src="previewImage" class="preview-image" />
      </div>
      <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" class="file-input">
    </div>

    <!-- 错误消息 -->
    <div v-if="errorMessage" class="error-message">
      <i class="el-icon-warning-outline"></i>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 压缩设置 -->
    <div class="compression-settings" v-if="previewImage">
      <div class="size-input">
        <label>目标大小：</label>
        <div class="input-group">
          <input type="number" v-model.number="targetSize" min="1" :max="maxSize" @keyup.enter="compressImage">
          <select v-model="sizeUnit">
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
      </div>

      <div class="button-group">
        <button @click="compressImage" :disabled="!previewImage" class="primary-btn">
          开始压缩
        </button>
        <button @click="clearImage" class="secondary-btn">
          清空
        </button>
      </div>
    </div>

    <!-- 压缩结果 -->
    <div class="compression-result" v-if="compressedImage">
      <h3>压缩结果</h3>
      <div class="result-image">
        <img :src="compressedImage" class="compressed-image" @click="openImageViewer" />
        <div class="click-tip">点击图片查看大图</div>
      </div>

      <div class="result-info">
        <div class="info-item">
          <span class="label">原始大小：</span>
          <span class="value">{{ originalSize }}</span>
        </div>
        <div class="info-item">
          <span class="label">压缩后大小：</span>
          <span class="value">{{ compressedSize }}</span>
        </div>
        <div class="info-item">
          <span class="label">压缩率：</span>
          <span class="value highlight">{{ compressionRatio }}%</span>
        </div>
      </div>

      <button @click="downloadImage" class="download-btn">
        <i class="el-icon-download"></i> 下载压缩后的图片
      </button>
    </div>
    
    <!-- 图片查看器模态框 -->
    <div class="image-viewer" v-if="showImageViewer" @click="closeImageViewer">
      <div class="image-viewer-content">
        <img :src="compressedImage" class="full-image" @click.stop>
        <button class="close-button" @click="closeImageViewer">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useImageCompressor, compressImageFile, blobToFile } from '@/core/tools/ImageCompressor.js';

// 文件选择输入框引用
const fileInput = ref(null);
const maxSize = ref(2048);

// 使用自定义的图片压缩逻辑组合式函数
const {
  isDragging,           // 拖拽状态
  previewImage,         // 预览图片的URL
  originalFile,         // 原始图片文件对象
  compressedImage,      // 压缩后图片的URL
  targetSize,           // 目标大小（数值）
  sizeUnit,             // 目标大小单位（KB/MB）
  originalSize,         // 原始图片大小（格式化）
  compressedSize,       // 压缩后图片大小（格式化）
  compressionRatio,     // 压缩率
  errorMessage,         // 错误消息
  handleDragOver,       // 拖拽悬停处理
  handleDragLeave,      // 拖拽离开处理
  handleDrop,           // 拖拽释放处理
  handleFileSelect,     // 文件选择处理
  downloadImage,        // 下载压缩图片
  clearImage,           // 清空图片
  formatSize            // 文件大小格式化
} = useImageCompressor();

/**
 * 执行图片压缩
 */
const compressImage = async () => {
  if (!originalFile.value) return;
  try {
    const options = {
      maxSizeKB: targetSize.value * (sizeUnit.value === 'MB' ? 1024 : 1),
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
      minQuality: 0.1,
      format: 'image/jpeg',
      preserveAspectRatio: true
    };
    const { blob, compressionInfo } = await compressImageFile(originalFile.value, options);
    compressedImage.value = URL.createObjectURL(blob);
    compressedSize.value = formatSize(blob.size);
    compressionRatio.value = compressionInfo.ratio;
  } catch (error) {
    // 压缩失败处理
  }
};

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value.click();
};

// 图片查看器状态
const showImageViewer = ref(false);

/**
 * 打开图片查看器
 */
const openImageViewer = () => {
  showImageViewer.value = true;
};

/**
 * 关闭图片查看器
 */
const closeImageViewer = () => {
  showImageViewer.value = false;
};
</script>

<style scoped>
.mp-image-compressor {
  padding: 16px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 110px);
}

h2 {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px;
  text-align: center;
}

.subtitle {
  color: #666;
  font-size: 14px;
  text-align: center;
  margin: 0 0 20px;
}

/* 上传区域 */
.upload-area {
  background-color: #fff;
  border-radius: 12px;
  border: 2px dashed #ddd;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area.drag-over {
  border-color: #07c160;
  background-color: #f0fff0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.upload-icon {
  font-size: 40px;
  color: #07c160;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  margin: 0;
}

.file-input {
  display: none;
}

/* 预览容器 */
.preview-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

/* 错误消息 */
.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: #f5222d;
}

.error-message i {
  margin-right: 8px;
  font-size: 18px;
}

/* 压缩设置 */
.compression-settings {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.size-input {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.size-input label {
  flex: 0 0 80px;
  font-size: 15px;
  color: #333;
}

.input-group {
  flex: 1;
  display: flex;
}

.input-group input {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px 0 0 8px;
  padding: 0 12px;
  font-size: 15px;
}

.input-group select {
  width: 70px;
  height: 40px;
  border: 1px solid #ddd;
  border-left: none;
  border-radius: 0 8px 8px 0;
  background-color: #f5f5f5;
  padding: 0 8px;
  font-size: 15px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.primary-btn, .secondary-btn, .download-btn {
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  padding: 0 16px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.primary-btn {
  background-color: #07c160;
  color: #fff;
}

.secondary-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

/* 压缩结果 */
.compression-result {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.compression-result h3 {
  font-size: 17px;
  color: #333;
  margin: 0 0 16px;
  text-align: center;
}

.result-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.compressed-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
  cursor: pointer;
}

.click-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

.result-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
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

.info-item .highlight {
  color: #07c160;
}

.download-btn {
  background-color: #1989fa;
  color: #fff;
  width: 100%;
}

.download-btn i {
  margin-right: 8px;
}

/* 图片查看器样式 */
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.image-viewer-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.full-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.close-button {
  position: absolute;
  bottom: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
}
</style> 