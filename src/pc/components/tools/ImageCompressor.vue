<template>
  <div class="image-compressor">
    <h2>图片压缩工具</h2>
    <p class="subtitle">支持所有图片格式</p>

    <div class="compressor-container">
      <!-- 左侧：上传和压缩设置 -->
      <div class="left-panel">
        <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave" @click="triggerFileInput" :class="{ 'drag-over': isDragging }">
          <div v-if="!previewImage" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p class="upload-text">拖拽或点击上传图片</p>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" class="file-input">
          </div>
          <div v-else class="preview-container">
            <el-image :src="previewImage" class="preview-image" :preview-src-list="[previewImage]" :initial-index="0"
              fit="contain" @click.stop hide-on-click-modal />
          </div>
        </div>

        <!-- 错误消息显示 -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
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
            <button @click="compressImage" :disabled="!previewImage" class="compress-btn">
              开始压缩
            </button>
            <button @click="clearImage" class="clear-btn">
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：压缩结果 -->
      <div class="right-panel" v-if="compressedImage">
        <div class="result-preview">
          <el-image :src="compressedImage" class="compressed-preview-image" :preview-src-list="[compressedImage]"
            :initial-index="0" fit="contain" hide-on-click-modal>
            <template #error>
              <div class="image-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
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
          <i class="fas fa-download"></i> 下载压缩后的图片
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useImageCompressor, compressImageFile, blobToFile } from '@/core/tools/ImageCompressor.js';

// 文件选择输入框引用
const fileInput = ref(null);

// 使用自定义的图片压缩逻辑组合式函数
const {
  isDragging,           // 拖拽状态
  previewImage,         // 预览图片的URL
  originalFile,         // 原始图片文件对象
  compressedImage,      // 压缩后图片的URL
  targetSize,           // 目标大小（数值）
  sizeUnit,             // 目标大小单位（KB/MB）
  maxSize,              // 最大允许输入的大小
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
      maxWidth: 2048,
      maxHeight: 2048,
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
    console.error('压缩失败:', error);
  }
};

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value.click();
};
</script>

<style scoped>
/* 组件容器 */
.image-compressor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* 标题 */
h2 {
  text-align: center;
  color: #2c3e50;
  margin: 0 0 10px;
  font-weight: 600;
  font-size: 32px;
}

.subtitle {
  color: #666;
  margin: 0 0 30px;
  font-size: 16px;
  text-align: center;
}

/* 压缩器容器 */
.compressor-container {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

/* 左侧面板 */
.left-panel,
.right-panel {
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
  cursor: pointer;
}

.drop-zone:hover,
.drag-over {
  border-color: #2196f3;
  background-color: #f1f8fe;
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
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.upload-text {
  font-size: 20px;
  margin: 15px 0;
  color: #2c3e50;
}

.file-input {
  display: none;
}

/* 预览容器 */
.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

:deep(.el-image) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-image__inner) {
  max-height: 300px;
  border-radius: 8px;
  transition: transform 0.3s;
}

:deep(.el-image__inner:hover) {
  transform: scale(1.02);
}

/* 压缩设置 */
.compression-settings {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

.size-input {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.size-input label {
  margin-right: 10px;
  min-width: 80px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background: #fff;
  min-width: 80px;
  text-align: center;
}

.input-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background: #fff;
  min-width: 80px;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 10px;
}

.compress-btn,
.clear-btn,
.download-btn {
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

.compress-btn {
  background: #2196f3;
  color: white;
  flex: 2;
}

.compress-btn:hover {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.compress-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.clear-btn {
  background: #ff5252;
  color: white;
  flex: 1;
}

.clear-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
}

/* 结果预览 */
.result-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.compressed-preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

/* 结果信息 */
.result-info {
  padding: 25px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.label {
  color: #606266;
}

.value {
  font-weight: bold;
  color: #303133;
}

.highlight {
  color: #2196f3;
  font-weight: 600;
  font-size: 18px;
}

/* 下载按钮 */
.download-btn {
  background: #4caf50;
  color: white;
  width: 100%;
}

.download-btn:hover {
  background: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

/* 错误状态 */
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
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
  margin-top: 15px;
}

.error-message i {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .compressor-container {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    width: 100%;
  }

  .drop-zone {
    padding: 20px;
    min-height: 200px;
  }

  .size-input {
    flex-direction: column;
    align-items: flex-start;
  }

  .input-group {
    width: 100%;
  }

  .input-group input,
  .input-group select {
    flex: 1;
  }
}
</style>