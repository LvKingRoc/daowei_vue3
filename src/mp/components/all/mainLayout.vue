<template>
  <div class="mp-main-layout">
    <!-- 头部区域 - 在样板管理和订单管理页面隐藏 -->
    <mp-header 
      v-if="!isCustomHeaderPage" 
      :title="currentTitle"
      class="slide-down-enter"
    ></mp-header>
    
    <!-- 菜单区域（仅在父路由的根路径时显示） -->
    <menu-component 
      v-if="showMenu" 
      class="fade-enter"
    ></menu-component>
    
    <!-- 内容区域 -->
    <div 
      class="mp-content" 
      :class="{ 'has-menu': showMenu }"
      ref="contentRef"
    >
      <router-view></router-view>
    </div>
    
    <!-- 底部导航栏 -->
    <footer-component class="slide-up-enter" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMpAuthStore } from '@/mp/stores/auth'; // 使用移动端专用的auth store
import FooterComponent from './footer.vue';
import MenuComponent from './menu.vue';
import MpHeader from './header.vue';

const route = useRoute();
const router = useRouter();
const authStore = useMpAuthStore();
const userRole = computed(() => authStore.role);

// 显示菜单的条件：当前路径是父路由的根路径，不是子路由，且不是主页和退出页面
const showMenu = computed(() => {
  const path = route.path;
  const mainPaths = [
    `/${userRole.value}/management`, 
    `/${userRole.value}/tools`
  ];
  
  // 确保是完全匹配的路径，不是子路由路径
  return mainPaths.includes(path) && !path.includes('/management/') && !path.includes('/tools/');
});

// 获取当前页面标题
const currentTitle = computed(() => {
  return route.meta.title as string || '道威系统';
});

// 当前组件引用
const currentComponent = ref<any>(null);

// 判断是否为使用自定义头部的页面（通过路由元数据中的hideHeader属性判断）
const isCustomHeaderPage = computed(() => {
  return route.meta.hideHeader === true;
});

// 检查当前路由是否与用户角色匹配
const checkRouteRoleMatch = () => {
  // 如果路由需要认证并且指定了角色
  if (route.meta.requiresAuth && route.meta.role) {
    // 如果角色不匹配当前用户角色
    if (route.meta.role !== userRole.value) {
      // 重定向到对应角色的首页
      const homePath = userRole.value === 'admin' ? '/admin/home' : '/user/home';
      router.push(homePath);
      // 强制刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return false;
    }
  }
  return true;
};

// 监听路由变化，确保在路由变化后能够正确获取组件实例
watch(() => route.path, async (newPath, oldPath) => {
  await nextTick();
  // 检查路由与角色是否匹配
  checkRouteRoleMatch();
}, { immediate: true });

// 监听用户角色变化
watch(userRole, (newRole, oldRole) => {
  if (oldRole && oldRole !== newRole) {
    checkRouteRoleMatch();
  }
});

onMounted(() => {
  // 挂载时检查路由与角色是否匹配
  checkRouteRoleMatch();
});

// 组件引用
const contentRef = ref<HTMLElement | null>(null);

// 过渡动画处理函数
const beforeEnter = () => {
  // 组件即将进入
};

const afterEnter = () => {
  // 组件已进入
};

const enterCancelled = () => {
  // 组件进入被取消
};
</script>

<style scoped>
.mp-main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: env(safe-area-inset-bottom, 50px);
  background-color: var(--bg-color, #f5f5f5);
}

.mp-header {
  height: 44px;
  background-color: var(--header-bg, #ffffff);
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mp-header h1 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.mp-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--content-bg, #f8f9fa);
  transition: padding-top 0.3s ease;
}

.mp-content.has-menu {
  padding-top: 0;
}

.header-actions {
  display: flex;
  gap: 20px;
}

.header-actions i {
  font-size: 20px;
  color: #07c160;
  cursor: pointer;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-down-enter {
  animation: slideDown 0.3s ease-out;
}

.slide-up-enter {
  animation: slideUp 0.3s ease-out;
}

.fade-enter {
  animation: fadeIn 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #121212;
    --header-bg: rgba(18, 18, 18, 0.8);
    --content-bg: #1e1e1e;
  }
}

/* 响应式优化 */
@media screen and (min-width: 768px) {
  .mp-main-layout {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .mp-main-layout {
    padding-bottom: max(env(safe-area-inset-bottom, 50px), 50px);
  }
}
</style> 