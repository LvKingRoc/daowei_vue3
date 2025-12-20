<template>
  <!-- 首页容器 -->
  <div class="home-container">
    <div class="welcome-content">
      <h1 class="welcome-greeting">您好，<span class="user-name">{{ userName }}</span></h1>
      <h1 class="welcome-main-title">欢迎使用 <span class="system-name">道威管理系统</span></h1>
      <h2 class="welcome-subtitle">请点击左侧菜单栏进入系统</h2>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlatformAuthStore } from '@/stores/platformAuth';

const authStore = usePlatformAuthStore();

// 获取用户显示名称
const userName = computed(() => {
  return authStore.name || authStore.username || '用户';
});
</script>

<style scoped>
/* 首页容器样式 */
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 95px);
  width: 100%;
  padding: 20px;
  position: relative;
}

/* 欢迎内容样式 */
.welcome-content {
  text-align: center;
  max-width: 800px;
}

/* 欢迎问候语样式 */
.welcome-greeting {
  font-size: 28px;
  color: #374151;
  font-weight: normal;
  margin-bottom: 16px;
}

.user-name {
  color: #2563eb;
  font-weight: 600;
}

/* 主标题样式 */
.welcome-main-title {
  font-size: 28px;
  color: #4b5563;
  font-weight: normal;
  margin-bottom: 30px;
}

.system-name {
  color: #1a5276;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 副标题样式 */
.welcome-subtitle {
  font-size: 18px;
  color: #666;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.6;
}
</style> 