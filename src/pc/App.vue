<template>
  <!-- 应用根容器 -->
  <div :class="{ 'app-wrapper': !hiddenCommonComponents, 'full-screen': hiddenCommonComponents }">
    <!-- 显示公共组件（头部和菜单） -->
    <template v-if="!hiddenCommonComponents">
      <Header :isAuthenticated="authStore.isAuthenticated" :role="authStore.role" />
      <Menu :isAuthenticated="authStore.isAuthenticated" :role="authStore.role" />
    </template>
    <!-- 路由视图容器 -->
    <div :class="{ 'app-container': !hiddenCommonComponents, 'full-screen-content': hiddenCommonComponents }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/pc/components/layout/Header.vue';
import Menu from '@/pc/components/layout/Menu.vue';

import { usePlatformAuthStore as useAuthStore } from '@/stores/platformAuth';
import { startHeartbeat, stopHeartbeat } from '@/core/utils/heartbeat';
import { connectSSE, disconnectSSE } from '@/core/utils/notification';

const route = useRoute();
const authStore = useAuthStore();

// 计算是否隐藏公共组件
const hiddenCommonComponents = computed(() => route.meta.hiddenCommonComponents ?? false);

// 检查是否为登录页面
const isLoginPage = computed(() => route.path.includes('login'));

// 心跳检测和SSE连接：非登录页面启动，登录页面停止
watch(isLoginPage, (isLogin) => {
  if (isLogin) {
    stopHeartbeat();
    disconnectSSE();
  } else if (authStore.token) {
    startHeartbeat();
    connectSSE(authStore.userId || 'pc_user');
  }
}, { immediate: true });

// 组件挂载时初始化认证状态
onMounted(() => {
  if (authStore.token) {
    authStore.getUserInfo();
    if (!isLoginPage.value) {
      startHeartbeat();
    }
  }
});

onUnmounted(() => {
  stopHeartbeat();
});
</script>

<style scoped>
/* 应用整体布局 */
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 内容区域 */
.app-container {
  margin-left: 220px;
  margin-top: 95px;
  padding: 0;
  min-width: 0;
  width: auto;
  max-width: 100%;
  transition: all 0.3s;
  overflow-x: hidden;
}

/* 全屏模式 */
.full-screen {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}

/* 全屏内容区域 */
.full-screen-content {
  height: 100%;
  width: 100%;
  padding: 0;
}

/* 响应式布局：中屏 */
@media screen and (max-width: 992px) {
  .app-container {
    margin-left: 220px;
    padding: 0;
  }
}

/* 响应式布局：小屏 */
@media screen and (max-width: 768px) {
  .app-container {
    margin-top: 60px;
    margin-left: 220px;
    padding: 0;
  }
}
</style> 