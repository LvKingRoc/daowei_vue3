<template>
  <div class="footer-wrapper">
    <div class="mp-footer">
      <div 
        v-for="tab in filteredTabRoutes" 
        :key="tab.path" 
        class="footer-tab" 
        :class="{ active: activeTab === tab.path }"
        @click="navigateTo(tab.path)"
      >
        <div class="tab-content">
          <i :class="[tab.meta.icon, 'tab-icon']"></i>
          <span class="tab-label">{{ tab.meta.title }}</span>
          <div class="tab-indicator" v-show="activeTab === tab.path"></div>
        </div>
        <div class="ripple-container" ref="rippleContainers"></div>
      </div>
    </div>
    <!-- 调试信息 -->
    <div class="debug-info" style="display: none;">
      <p>当前角色: {{ userRole }}</p>
      <p>当前路径: {{ route.path }}</p>
      <p>可用标签页: {{ filteredTabRoutes.length }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMpAuthStore } from '@/mp/stores/auth'; // 使用移动端专用的auth store
import { RouteRecordRaw } from 'vue-router';

const router = useRouter();
const route = useRoute();
const authStore = useMpAuthStore();
const userRole = computed(() => authStore.role);
const rippleContainers = ref<HTMLElement[]>([]);

// 获取所有标记为底部选项卡的路由（根据meta.isTab字段）
const tabRoutes = computed(() => {
  const routes = router.getRoutes();
  return routes
    .filter(route => route.meta.isTab)
    .sort((a, b) => ((a.meta.order as number) || 0) - ((b.meta.order as number) || 0));
});

// 根据当前用户角色过滤路由
const filteredTabRoutes = computed(() => {
  return tabRoutes.value.filter(route => {
    // 只显示当前角色的路由
    return route.meta.role === userRole.value;
  });
});

// 当前激活的标签
const activeTab = computed(() => {
  const path = route.path;
  // 检查当前路径是否匹配任何tab的路径前缀
  for (const tab of filteredTabRoutes.value) {
    if (path === tab.path || path.startsWith(tab.path + '/')) {
      return tab.path;
    }
  }
  // 默认返回第一个标签
  return filteredTabRoutes.value.length > 0 ? filteredTabRoutes.value[0].path : `/${userRole.value}/home`;
});

// 创建涟漪效果
const createRipple = (event: MouseEvent, element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('div');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.className = 'ripple';
  
  element.appendChild(ripple);
  
  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
};

// 导航到指定路径
const navigateTo = async (path: string, event?: MouseEvent) => {
  // 如果有事件对象，创建涟漪效果
  if (event && event.currentTarget) {
    const tabIndex = filteredTabRoutes.value.findIndex(tab => tab.path === path);
    if (tabIndex >= 0 && rippleContainers.value[tabIndex]) {
      createRipple(event, rippleContainers.value[tabIndex]);
    }
  }

  const targetRoute = router.getRoutes().find(r => r.path === path);
  if (targetRoute?.meta.role && targetRoute.meta.role !== userRole.value) {
    await router.push(path);
    window.location.reload();
    return;
  }
  
  router.push(path);
};

// 监听用户角色变化
let previousRole = userRole.value;
watch(userRole, (newRole) => {
  if (previousRole !== newRole && previousRole !== '') {
    // 延迟一点执行刷新，确保路由导航完成
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
  previousRole = newRole;
});

onMounted(() => {
  // 初始化之前的角色
  previousRole = userRole.value;
  
  // 如果当前路径不在tabs中，可能需要重定向
  if (!filteredTabRoutes.value.some(tab => route.path === tab.path || route.path.startsWith(tab.path + '/'))) {
    // 可以选择重定向到默认标签页
    if (filteredTabRoutes.value.length > 0) {
      router.push(filteredTabRoutes.value[0].path);
    }
  }
});
</script>

<style scoped>
.footer-wrapper {
  width: 100%;
}

.mp-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(50px + env(safe-area-inset-bottom, 0px));
  background-color: var(--footer-bg, rgba(255, 255, 255, 0.95));
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.1);
}

.footer-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 50px;
  color: var(--text-secondary, #999);
  font-size: 12px;
  padding: 6px 0;
  transition: all 0.3s ease;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.tab-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-label {
  font-size: 11px;
  line-height: 1.2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center bottom;
}

.footer-tab.active {
  color: var(--primary-color, #07c160);
}

.footer-tab.active .tab-icon {
  transform: translateY(-2px) scale(1.1);
}

.footer-tab.active .tab-label {
  transform: scale(1.05);
  font-weight: 500;
}

.tab-indicator {
  position: absolute;
  bottom: -6px;
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: currentColor;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(0);
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mp-footer {
    --footer-bg: rgba(18, 18, 18, 0.95);
    --text-secondary: #666;
    --primary-color: #42d392;
    --border-color: rgba(255, 255, 255, 0.1);
  }

  .ripple {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 大屏幕适配 */
@media screen and (min-width: 768px) {
  .mp-footer {
    max-width: 768px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>