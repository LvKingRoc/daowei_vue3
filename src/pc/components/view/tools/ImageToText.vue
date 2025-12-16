<template>
  <div class="text-recognition">
    <h2>图片文字识别工具</h2>
    <p class="subtitle">支持 jpg、png、bmp 等格式，仅横向识别，基于百度云高精度OCR（每月有限额，非必要请勿使用）</p>

    <div class="recognition-container">
      <!-- 左侧：上传图片 -->
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

        <!-- 识别设置 -->
        <div class="recognition-settings" v-if="previewImage">
          <div class="options">
            <label>识别语言：</label>
            <select v-model="language">
              <option value="CHN_ENG">中英文混合</option>
              <option value="ENG">英文</option>
              <option value="JAP">日语</option>
              <option value="KOR">韩语</option>
            </select>
          </div>

          <div class="button-group">
            <button @click="recognizeText" :disabled="!previewImage || isRecognizing" class="recognize-btn">
              {{ isRecognizing ? '识别中...' : '开始识别' }}
            </button>
            <button @click="clearImage" class="clear-btn">
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：识别结果 -->
      <div class="right-panel" v-if="recognizedText">
        <div class="result-header">
          <h3>识别结果</h3>
          <div class="result-actions">
            <button @click="copyText" class="action-btn">
              <i class="fas fa-copy"></i> 复制文本
            </button>
            <button @click="downloadText" class="action-btn">
              <i class="fas fa-download"></i> 下载文本
            </button>
          </div>
        </div>

        <div class="result-content">
          <textarea v-model="recognizedText" readonly class="result-textarea"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useImageToText } from '@/core/tools/ImageToText.js';

// 文件选择输入框引用
const fileInput = ref(null);

// 使用自定义的图片转文字逻辑组合式函数
const {
  isDragging,         // 拖拽状态
  previewImage,       // 预览图片的URL
  originalFile,       // 原始图片文件对象
  recognizedText,     // 识别出的文本内容
  language,           // 识别语言
  isRecognizing,      // 是否正在识别
  handleDragOver,     // 拖拽悬停处理
  handleDragLeave,    // 拖拽离开处理
  handleDrop,         // 拖拽释放处理
  handleFileSelect,   // 文件选择处理
  recognizeText,      // 执行识别
  copyText,           // 复制识别结果
  downloadText,       // 下载识别结果
  clearImage          // 清空图片和结果
} = useImageToText();

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value.click();
};
</script>

<style scoped>
/* 组件容器 */
.text-recognition {
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

/* 识别器容器 */
.recognition-container {
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

/* 识别设置 */
.recognition-settings {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

.options {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.options label {
  margin-right: 10px;
  min-width: 80px;
}

.options select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background: #fff;
  min-width: 150px;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 10px;
}

.recognize-btn,
.clear-btn,
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

.recognize-btn {
  background: #2196f3;
  color: white;
  flex: 2;
}

.recognize-btn:hover {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.recognize-btn:disabled {
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

/* 结果区域 */
.right-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  font-size: 14px;
}

.action-btn:first-child {
  background: #9c27b0;
  color: white;
}

.action-btn:first-child:hover {
  background: #7b1fa2;
}

.action-btn:last-child {
  background: #4caf50;
  color: white;
}

.action-btn:last-child:hover {
  background: #388e3c;
}

.result-content {
  width: 100%;
}

.result-textarea {
  width: 100%;
  min-height: 300px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: #f9f9f9;
  resize: vertical;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recognition-container {
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

  .options {
    flex-direction: column;
    align-items: flex-start;
  }

  .options select {
    width: 100%;
    margin-top: 8px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-actions {
    margin-top: 10px;
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}
</style> 