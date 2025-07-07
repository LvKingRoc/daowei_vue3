<template>
  <div class="mp-menu">
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="menu-loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 菜单列表 -->
    <transition-group 
      name="menu-slide" 
      tag="div" 
      class="menu-group"
      v-else-if="currentMenuItems.length > 0 && !isLoading"
    >
      <div 
        v-for="(item, index) in visibleMenuItems" 
        :key="item.name?.toString() || `item-${index}`"
        class="menu-item"
        :style="getDelayStyle(index)"
        @click="navigateTo(item.path)"
      >
        <div class="menu-item-content">
          <div class="menu-item-left">
            <div 
              class="menu-icon" 
              :style="{
                backgroundColor: item.meta.iconBg as string || 'var(--primary-color)',
                '--icon-color': item.meta.iconColor as string || '#fff'
              }"
            >
              <i :class="item.meta.icon"></i>
            </div>
            <div class="menu-label">{{ item.meta.title }}</div>
          </div>
          
          <div class="menu-item-right">
            <div 
              v-if="item.meta.badge" 
              class="menu-badge"
              :class="{ 'animated': item.meta.badge > 0 }"
            >
              {{ item.meta.badge }}
            </div>
            <i class="el-icon-arrow-right"></i>
          </div>
        </div>
        
        <div class="menu-item-ripple" ref="rippleContainers"></div>
      </div>
    </transition-group>
    
    <!-- 空菜单状态 -->
    <div v-else-if="!isLoading" class="empty-menu">
      <i class="el-icon-folder-opened"></i>
      <p>暂无可用菜单项</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userRole = computed(() => authStore.role);
const rippleContainers = ref<HTMLElement[]>([]);

// 加载状态
const isLoading = ref(true);
const visibleMenuItems = ref<any[]>([]);

// 获取延迟样式
const getDelayStyle = (index: number) => {
  let delay = '0.1s';
  if (index === 1) delay = '0.15s';
  if (index === 2) delay = '0.2s';
  if (index === 3) delay = '0.25s';
  if (index === 4) delay = '0.3s';
  if (index === 5) delay = '0.35s';
  if (index === 6) delay = '0.4s';
  if (index === 7) delay = '0.45s';
  if (index === 8) delay = '0.5s';
  if (index === 9) delay = '0.55s';
  return { '--delay': delay };
};

// 获取当前激活的父路由
const currentParentRoute = computed(() => {
  const path = route.path;
  const parentRoutes = router.getRoutes()
    .filter(r => r.meta.isTab && r.meta.role === userRole.value);
  
  const matchedParent = parentRoutes.find(parent => 
    path === parent.path || path.startsWith(parent.path + '/'));
  
  return matchedParent || (parentRoutes.length > 0 ? parentRoutes[0] : null); 
});

// 获取当前父路由下的子路由项目
const currentMenuItems = computed(() => {
  if (!currentParentRoute.value) return [];
  
  const parent = currentParentRoute.value;
  const fullPath = parent.path;
  
  // 如果是主页或退出页面，不显示子菜单
  if (parent.path.endsWith('/home') || parent.path.endsWith('/support')) {
    return [];
  }
  
  return router.getRoutes()
    .filter(route => {
      const isChild = route.path.startsWith(fullPath + '/') && 
                     route.path.split('/').length === fullPath.split('/').length + 1;
      return isChild && route.meta.role === userRole.value;
    })
    .sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
});

// 监听路由变化，重置加载状态
watch(() => route.path, () => {
  isLoading.value = true;
  visibleMenuItems.value = [];
  
  // 模拟数据加载
  setTimeout(() => {
    isLoading.value = false;
    // 数据加载完成后，延迟显示菜单项
    nextTick(() => {
      visibleMenuItems.value = [...currentMenuItems.value];
    });
  }, 300); // 模拟加载时间
}, { immediate: true });

// 监听菜单项变化
watch(currentMenuItems, (newItems) => {
  if (!isLoading.value) {
    visibleMenuItems.value = [...newItems];
  }
}, { deep: true });

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
const navigateTo = (path: string, event?: MouseEvent) => {
  if (event && event.currentTarget) {
    const menuIndex = visibleMenuItems.value.findIndex(item => item.path === path);
    if (menuIndex >= 0 && rippleContainers.value[menuIndex]) {
      createRipple(event, rippleContainers.value[menuIndex]);
    }
  }
  
  if (path) {
    router.push(path);
  }
};
</script>

<style scoped>
.mp-menu {
  background-color: var(--menu-bg, #f8f9fa);
  padding: 12px 16px;
  min-height: 200px;
}

/* 加载中样式 */
.menu-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary, #999);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #42d392);
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-group {
  background-color: var(--card-bg, #fff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.menu-item {
  position: relative;
  overflow: hidden;
  animation: slideDown 0.4s ease-out forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

.menu-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.menu-item::after {
  content: '';
  position: absolute;
  left: 64px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background-color: var(--border-color, rgba(0, 0, 0, 0.06));
  transform-origin: left;
  transform: scaleY(0.5);
}

.menu-item:last-child::after {
  display: none;
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
}

.menu-icon i {
  font-size: 18px;
  color: var(--icon-color);
}

.menu-label {
  font-size: 16px;
  color: var(--text-primary, #333);
  font-weight: 500;
}

.menu-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background-color: var(--badge-bg, #ff4d4f);
  color: #fff;
  font-size: 12px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-badge.animated {
  animation: pulse 2s infinite;
}

.el-icon-arrow-right {
  font-size: 14px;
  color: var(--text-secondary, #999);
  transition: transform 0.2s ease;
}

.menu-item:active .menu-icon {
  transform: scale(0.95);
}

.menu-item:active .el-icon-arrow-right {
  transform: translateX(4px);
}

.menu-item-ripple {
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
  background-color: var(--ripple-color, rgba(0, 0, 0, 0.1));
  transform: scale(0);
  animation: ripple 0.6s linear;
}

.empty-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary, #999);
}

.empty-menu i {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-menu p {
  font-size: 14px;
  margin: 0;
}

/* 动画 */
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

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 菜单列表过渡动画 */
.menu-slide-enter-active {
  transition: all 0.3s ease-out;
  transition-delay: var(--delay, 0s);
}

.menu-slide-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
}

.menu-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.menu-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --menu-bg: #121212;
    --card-bg: #1e1e1e;
    --text-primary: #fff;
    --text-secondary: #888;
    --border-color: rgba(255, 255, 255, 0.1);
    --ripple-color: rgba(255, 255, 255, 0.1);
    --badge-bg: #cf1322;
    --primary-color: #42d392;
  }
}

/* 大屏幕适配 */
@media screen and (min-width: 768px) {
  .mp-menu {
    max-width: 768px;
    margin: 0 auto;
  }
  
  .menu-group {
    transition: transform 0.3s ease;
  }
  
  .menu-group:hover {
    transform: translateY(-2px);
  }
}
</style>