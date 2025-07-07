<template>
  <div class="mp-image-to-text">
    <h2>图片文字识别工具</h2>
    <p class="subtitle">基于百度云高精度OCR（每月有限额，非必要请勿使用）</p>

    <!-- 上传区域 -->
    <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" @click="triggerFileInput" :class="{ 'drag-over': isDragging }">
      <div v-if="!previewImage" class="upload-placeholder">
        <i class="el-icon-picture-outline upload-icon"></i>
        <p class="upload-text">点击或拖拽上传图片</p>
      </div>
      <div v-else class="preview-container">
        <img :src="previewImage" class="preview-image" />
      </div>
      <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" class="file-input">
    </div>

    <!-- 识别设置 -->
    <div class="recognition-settings" v-if="previewImage">
      <div class="language-select">
        <label>识别语言：</label>
        <select v-model="language">
          <option value="CHN_ENG">中英文混合</option>
          <option value="ENG">英文</option>
          <option value="JAP">日语</option>
          <option value="KOR">韩语</option>
        </select>
      </div>

      <div class="button-group">
        <button @click="recognizeText" :disabled="!previewImage || isRecognizing" class="primary-btn">
          {{ isRecognizing ? '识别中...' : '开始识别' }}
        </button>
        <button @click="clearImage" class="secondary-btn">
          清空
        </button>
      </div>
    </div>

    <!-- 识别结果 -->
    <div class="recognition-result" v-if="recognizedText">
      <div class="result-header">
        <h3>识别结果</h3>
        <div class="result-actions">
          <button @click="copyText" class="action-btn">
            <i class="el-icon-document-copy"></i> 复制
          </button>
          <button @click="downloadText" class="action-btn">
            <i class="el-icon-download"></i> 下载
          </button>
        </div>
      </div>

      <div class="result-content">
        <textarea v-model="recognizedText" readonly class="result-textarea"></textarea>
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
.mp-image-to-text {
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
  border-color: #1989fa;
  background-color: #f0f8ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.upload-icon {
  font-size: 40px;
  color: #1989fa;
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

/* 识别设置 */
.recognition-settings {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.language-select {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.language-select label {
  flex: 0 0 80px;
  font-size: 15px;
  color: #333;
}

.language-select select {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f5f5f5;
  padding: 0 12px;
  font-size: 15px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.primary-btn, .secondary-btn {
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
  background-color: #1989fa;
  color: #fff;
}

.secondary-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

/* 识别结果 */
.recognition-result {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h3 {
  font-size: 17px;
  color: #333;
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  cursor: pointer;
}

.action-btn i {
  margin-right: 4px;
}

.result-content {
  width: 100%;
}

.result-textarea {
  width: 100%;
  min-height: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  background-color: #f9f9f9;
  resize: vertical;
}
</style> 