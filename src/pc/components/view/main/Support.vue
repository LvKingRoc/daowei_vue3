<template>
  <!-- 支持页面容器 -->
  <div class="support-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="support-content">
      <!-- 头部区域 -->
      <div class="header-section">
        <div class="icon-wrapper">
          <svg class="heart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGradient)"/>
            <defs>
              <linearGradient id="heartGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                <stop stop-color="#ff6b6b"/>
                <stop offset="1" stop-color="#ee5a5a"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 class="support-title">感谢您的支持</h2>
        <p class="support-subtitle">您的每一份支持都是我们前进的动力</p>
      </div>

      <!-- 支付方式切换 -->
      <div class="payment-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: currentImage === 'wx' }"
          @click="currentImage = 'wx'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66l-.7 2.14 2.52-1.26c.94.26 1.94.46 3 .46.17 0 .34 0 .5-.02-.16-.53-.1-1.08-.1-1.63 0-3.31 3.36-6 7.5-6 .17 0 .34 0 .5.02C17.22 5.66 13.72 4 9.5 4zm-2 4.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            <path d="M17.5 10c-3.31 0-6 2.24-6 5s2.69 5 6 5c.86 0 1.67-.14 2.42-.38l2.08 1.04-.58-1.77C22.45 18.27 23.5 16.73 23.5 15c0-2.76-2.69-5-6-5zm-2 5.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm4 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z"/>
          </svg>
          <span>微信支付</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentImage === 'zfb' }"
          @click="currentImage = 'zfb'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.422 15.358c-3.83-1.153-6.055-2.2-7.18-2.907.903-1.603 1.586-3.413 1.903-5.451h-4.145v-1.5h5v-1.5h-5v-2h-2v2h-5v1.5h5v1.5h-4.5v1.5h8.643c-.27 1.5-.81 2.9-1.543 4.1-1.39-.65-2.6-1.1-2.6-1.1l-.7 1.4s1.4.55 3 1.35c-1.2 1.4-2.8 2.55-4.8 3.35l.8 1.4c2.4-1 4.3-2.4 5.7-4.1 1.1.65 3.2 1.65 6.7 2.75l.72-1.78z"/>
          </svg>
          <span>支付宝</span>
        </button>
        <div class="tab-indicator" :class="{ 'is-alipay': currentImage === 'zfb' }"></div>
      </div>

      <!-- 二维码展示区域 -->
      <div class="qrcode-section">
        <div class="qrcode-wrapper" :class="currentImage">
          <Transition name="qrcode-fade" mode="out-in">
            <div v-if="currentImage === 'wx'" key="wx" class="qrcode-card wx">
              <div class="qrcode-inner">
                <img src="@/assets/image/wx.png" alt="微信支付" class="qrcode-image">
              </div>
              <p class="scan-tip">打开微信扫一扫</p>
            </div>
            <div v-else key="zfb" class="qrcode-card zfb">
              <div class="qrcode-inner">
                <img src="@/assets/image/zfb.jpg" alt="支付宝支付" class="qrcode-image">
              </div>
              <p class="scan-tip">打开支付宝扫一扫</p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-section">
        <p class="footer-text">有一点是一点，感谢您的支持 ❤️</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentImage = ref('wx')
</script>

<style scoped>
/* 支持页面容器样式 */
.support-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 95px);
  width: 100%;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s ease-in-out infinite;
}

.bg-circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation-delay: -5s;
}

.bg-circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 10%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* 支持内容样式 */
.support-content {
  position: relative;
  z-index: 1;
  max-width: 480px;
  width: 100%;
  padding: 40px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* 头部区域 */
.header-section {
  text-align: center;
  margin-bottom: 32px;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-radius: 50%;
  margin-bottom: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.heart-icon {
  width: 32px;
  height: 32px;
}

.support-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.support-subtitle {
  margin: 0;
  font-size: 15px;
  color: #6b7280;
}

/* 支付方式切换 */
.payment-tabs {
  display: flex;
  position: relative;
  background: #f3f4f6;
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 28px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.tab-btn.active {
  color: white;
}

.tab-btn:hover:not(.active) {
  color: #374151;
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.tab-indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(50% - 6px);
  height: calc(100% - 12px);
  background: linear-gradient(135deg, #07c160 0%, #06ae56 100%);
  border-radius: 12px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.35);
}

.tab-indicator.is-alipay {
  left: calc(50%);
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.35);
}

/* 二维码展示区域 */
.qrcode-section {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.qrcode-wrapper {
  width: 100%;
  max-width: 280px;
}

.qrcode-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.qrcode-card.wx {
  border-color: rgba(7, 193, 96, 0.2);
}

.qrcode-card.zfb {
  border-color: rgba(22, 119, 255, 0.2);
}

.qrcode-inner {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-image {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  display: block;
}

.scan-tip {
  margin: 16px 0 0;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

.qrcode-card.wx .scan-tip {
  color: #07c160;
}

.qrcode-card.zfb .scan-tip {
  color: #1677ff;
}

/* 底部信息 */
.footer-section {
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 15px;
  color: #6b7280;
}

/* 二维码切换动画 */
.qrcode-fade-enter-active,
.qrcode-fade-leave-active {
  transition: all 0.35s ease;
}

.qrcode-fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.qrcode-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .support-container {
    padding: 24px 16px;
  }

  .support-content {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .support-title {
    font-size: 24px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .heart-icon {
    width: 28px;
    height: 28px;
  }

  .tab-btn {
    padding: 12px 16px;
    font-size: 14px;
  }

  .qrcode-card {
    padding: 16px;
  }

  .qrcode-inner {
    padding: 12px;
  }
}

@media (max-width: 360px) {
  .support-content {
    padding: 24px 16px;
  }

  .tab-btn {
    padding: 10px 12px;
    gap: 4px;
  }

  .tab-icon {
    width: 18px;
    height: 18px;
  }
}
</style>