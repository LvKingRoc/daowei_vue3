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

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/pc/components/all/Header.vue';
import Menu from '@/pc/components/all/Menu.vue';
import { usePcAuthStore } from '@/pc/stores/auth';

const route = useRoute();
const authStore = usePcAuthStore();

// 计算是否隐藏公共组件
const hiddenCommonComponents = computed(() => route.meta.hiddenCommonComponents ?? false);

// 组件挂载时初始化认证状态
onMounted(() => {
  if (authStore.token) {
    authStore.getUserInfo();
  }
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