<template>
  <div class="tool-page">
    <!-- 头部 -->
    <div class="tool-hero">
      <div class="hero-icon">
        <van-icon name="scan" size="32" color="#0ea5e9" />
      </div>
      <h1>图片转文字</h1>
      <p>OCR 智能识别</p>
    </div>

    <!-- 主内容区 -->
    <div class="tool-content">
      <!-- 上传区域 -->
      <div class="upload-card" v-if="!previewImage">
        <van-uploader :after-read="afterRead" accept="image/*">
          <div class="upload-trigger">
            <div class="upload-icon-wrap">
              <van-icon name="photograph" size="28" color="#9ca3af" />
            </div>
            <span class="upload-text">点击选择图片</span>
            <span class="upload-hint">支持 JPG / PNG / BMP</span>
          </div>
        </van-uploader>
      </div>

      <!-- 预览区域 -->
      <div class="preview-card" v-if="previewImage">
        <div class="image-preview" @click="showImagePreview([previewImage])">
          <van-image :src="previewImage" fit="contain" class="preview-img" />
        </div>
        <van-button plain size="small" type="default" icon="cross" @click="clearImage" class="clear-btn">
          移除
        </van-button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-tip">
        <van-icon name="info-o" /> {{ errorMessage }}
      </div>

      <!-- 识别设置 -->
      <div class="settings-card" v-if="previewImage">
        <div class="card-title">识别设置</div>
        <div class="setting-row" @click="showLanguagePicker = true">
          <span class="setting-label">识别语言</span>
          <div class="setting-value">
            <span>{{ getLanguageLabel(language) }}</span>
            <van-icon name="arrow" color="#9ca3af" />
          </div>
        </div>
        <van-button 
          type="primary" 
          block 
          round 
          :loading="isRecognizing" 
          loading-text="识别中..." 
          @click="recognizeText"
          class="action-btn"
        >
          开始识别
        </van-button>
      </div>

      <!-- 识别结果 -->
      <div class="result-card" v-if="recognizedText">
        <div class="card-title">识别结果</div>
        <div class="result-content">
          <textarea v-model="recognizedText" readonly class="result-textarea"></textarea>
        </div>
        <div class="result-actions">
          <van-button plain round size="small" icon="records" @click="copyText">复制文本</van-button>
          <van-button plain round size="small" type="success" icon="down" @click="handleDownload">下载 TXT</van-button>
        </div>
      </div>
    </div>

    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" position="bottom" round>
      <van-picker
        :columns="languageColumns"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showImagePreview, showToast } from 'vant';
import { useImageToText } from '@/core/tools/ImageToText.js';

const showLanguagePicker = ref(false);

const {
  previewImage,
  recognizedText,
  language,
  isRecognizing,
  errorMessage,
  handleFileSelect,
  recognizeText: coreRecognizeText,
  copyText: coreCopyText,
  downloadText,
  clearImage
} = useImageToText();

// 包装识别方法，添加提示
const recognizeText = async () => {
  await coreRecognizeText();
  if (recognizedText.value && !errorMessage.value) {
    showToast('识别成功');
  }
};

// 包装复制方法，添加提示
const copyText = async () => {
  const success = await coreCopyText();
  if (success) {
    showToast('复制成功');
  }
};

const languageColumns = [
  { text: '中英文混合', value: 'CHN_ENG' },
  { text: '英文', value: 'ENG' },
  { text: '日语', value: 'JAP' },
  { text: '韩语', value: 'KOR' },
];

const getLanguageLabel = (val) => {
  const item = languageColumns.find(col => col.value === val);
  return item ? item.text : val;
};

const onLanguageConfirm = ({ selectedOptions }) => {
  language.value = selectedOptions[0].value;
  showLanguagePicker.value = false;
};

const afterRead = (file) => {
  const rawFile = file.file;
  const mockEvent = {
    target: {
      files: [rawFile]
    }
  };
  handleFileSelect(mockEvent);
};

// 下载并提示
const handleDownload = () => {
  downloadText();
  showToast('文件已下载');
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
  background: linear-gradient(180deg, #f0f9ff 0%, #fff 100%);
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
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
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
  border-color: #0ea5e9;
  background: #f0f9ff;
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
  height: 200px;
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
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 16px;
}

.setting-label {
  font-size: 14px;
  color: #374151;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
}

.action-btn {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: none;
}

/* 结果卡片 */
.result-content {
  margin-bottom: 16px;
}

.result-textarea {
  width: 100%;
  min-height: 150px;
  padding: 14px;
  border: none;
  background: #f9fafb;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  resize: none;
  outline: none;
  font-family: inherit;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
