<template>
  <!-- 支持页面容器 -->
  <div class="support-container">
    <div class="support-content animate-fade-in">
      <h2 class="support-title animate-slide-down">
        <span class="title-text">感谢您的支持</span>
        <div class="title-underline"></div>
      </h2>

      <!-- 图片切换按钮 -->
      <div class="toggle-container animate-fade-in">
        <div class="toggle-wrapper" :class="{ 'is-alipay': currentImage === 'zfb' }">
          <button 
            class="toggle-btn" 
            :class="{ active: currentImage === 'wx' }"
            @click="currentImage = 'wx'"
          >
            <span class="btn-icon">💬</span>
            <span class="btn-text">微信</span>
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: currentImage === 'zfb' }"
            @click="currentImage = 'zfb'"
          >
            <span class="btn-icon">💙</span>
            <span class="btn-text">支付宝</span>
          </button>
          <div class="toggle-slider"></div>
        </div>
      </div>

      <div class="image-container animate-scale-in">
        <div class="image-wrapper">
          <transition name="fade-scale" mode="out-in">
            <img
              v-if="currentImage === 'wx'"
              key="wx"
              src="@/assets/image/wx.png"
              alt="微信支付"
              class="support-image"
              @load="handleImageLoad"
              :class="{ 'image-loaded': imageLoaded }"
            >
            <img
              v-else
              key="zfb"
              src="@/assets/image/zfb.jpg"
              alt="支付宝支付"
              class="support-image"
              @load="handleImageLoad"
              :class="{ 'image-loaded': imageLoaded }"
            >
          </transition>
        </div>
      </div>

      <p class="support-text animate-slide-up">
        您的支持是我们前进的动力
      </p>

      <div class="action-buttons animate-fade-in">
        <button
          class="logout-button ripple-effect"
          @click="confirmLogout"
          :disabled="isLoggingOut"
        >
          <span>{{ isLoggingOut ? '退出中...' : '退出登录' }}</span>
        </button>
      </div>

      <div class="company-info animate-fade-in">
        <p class="company-name">
          深圳市道威塑胶五金制品有限公司管理系统
        </p>
        <p class="author">
          @LvKingRoc
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Support',
  data() {
    return {
      imageLoaded: false,
      isLoggingOut: false,
      currentImage: 'wx'
    };
  },
  methods: {
    // 处理图片加载完成
    handleImageLoad() {
      this.imageLoaded = true;
    },

    // 退出登录确认（使用原生 confirm，避免引入 Element 依赖）
    async confirmLogout() {
      const ok = window.confirm('确认要退出登录吗？');
      if (!ok) return;
      await this.handleLogout();
    },

    // 退出登录处理
    async handleLogout() {
      this.isLoggingOut = true;

      try {
        // 清除登录信息
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('role');

        // 添加一个小延迟，让用户看到退出中的状态
        await new Promise(resolve => setTimeout(resolve, 800));

        // 跳转到登录页面
        await this.$router.push('/login');
      } catch (error) {
        // 失败忽略即可
      } finally {
        this.isLoggingOut = false;
      }
    }
  }
};
</script>

<style scoped>
/* 支持页面容器样式 */
.support-container {
  min-height: calc(100vh - 100px);
  padding: 20px 16px;
  background: var(--bg-gradient, linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%));
  display: flex;
  align-items: center;
  justify-content: center;
}

.support-content {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* 标题样式 */
.support-title {
  position: relative;
  color: var(--title-color, #2c5282);
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.title-text {
  position: relative;
  z-index: 1;
}

.title-underline {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: var(--primary-color, #4299e1);
  border-radius: 2px;
}

/* 图片容器样式 */
/* 切换按钮容器 */
.toggle-container {
  margin-bottom: 16px;
}

.toggle-wrapper {
  display: inline-flex;
  position: relative;
  background: #e8e8e8;
  border-radius: 30px;
  padding: 4px;
  gap: 4px;
}

.toggle-btn {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-radius: 26px;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  color: white;
}

.btn-icon {
  font-size: 14px;
}

.toggle-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #07c160 0%, #06ae56 100%);
  border-radius: 26px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
}

.toggle-wrapper.is-alipay .toggle-slider {
  left: calc(50%);
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

/* 图片切换动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.image-container {
  width: 100%;
  max-width: 320px;
  margin: 0;
  perspective: 1000px;
}

.image-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow, 0 8px 30px rgba(0, 0, 0, 0.12));
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.image-wrapper:hover {
  transform: rotateY(10deg);
}

/* 支持图片样式 */
.support-image {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: all 0.6s ease;
  transform: scale(1.1);
}

.support-image.image-loaded {
  opacity: 1;
  transform: scale(1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  color: white;
  text-align: center;
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.image-wrapper:hover .overlay-content {
  transform: translateY(0);
}

/* 支持文本样式 */
.support-text {
  color: var(--text-primary, #2d3748);
  font-size: 18px;
  line-height: 1.5;
  font-weight: 600;
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 按钮容器 */
.action-buttons {
  margin: 8px 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* 退出按钮样式 */
.logout-button {
  background: var(--danger-gradient, linear-gradient(145deg, #e53e3e, #c53030));
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 36px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--button-shadow, 0 6px 12px rgba(229, 62, 62, 0.25));
}

.logout-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 公司信息样式 */
.company-info {
  text-align: center;
  width: 100%;
  margin-top: 16px;
}

.company-name,
.author {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 4px 0;
}

.company-name {
  color: var(--text-secondary, #4a5568);
  font-size: 14px;
  font-weight: 500;
}

.author {
  color: var(--text-tertiary, #718096);
  font-size: 13px;
}

/* 动画类 */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-down {
  animation: slideDown 0.6s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.6s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-gradient: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    --title-color: #90cdf4;
    --text-primary: #e2e8f0;
    --text-secondary: #a0aec0;
    --text-tertiary: #718096;
    --primary-color: #4299e1;
    --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    --button-shadow: 0 6px 12px rgba(229, 62, 62, 0.4);
  }
}

/* 响应式优化 */
@media screen and (min-width: 768px) {
  .support-container {
    padding: 40px;
  }

  .support-content {
    gap: 32px;
  }

  .support-title {
    font-size: 28px;
  }

  .image-container {
    max-width: 400px;
  }
}
</style>
