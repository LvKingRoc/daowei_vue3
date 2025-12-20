<template>
  <!-- 首页容器 -->
  <div class="home-container">
    <div class="welcome-content">
      <h1 class="welcome-greeting">您好，<span class="user-name">{{ userName }}</span></h1>
      <h1 class="welcome-main-title">欢迎使用 <span class="system-name">道威管理系统</span></h1>
      <h2 class="welcome-subtitle">请点击下方菜单进入系统</h2>
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
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: #f7f8fa;
}

.welcome-content {
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.welcome-greeting {
  font-size: min(22px, 5.5vw);
  color: #374151;
  font-weight: normal;
  margin-bottom: 16px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

.user-name {
  color: #2563eb;
  font-weight: 600;
}

.welcome-main-title {
  font-size: min(22px, 5.5vw);
  color: #4b5563;
  font-weight: normal;
  margin-bottom: 24px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

.system-name {
  color: #1d4ed8;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

.welcome-subtitle {
  font-size: min(16px, 5vw);
  color: #6b7280;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.6;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}
</style>
