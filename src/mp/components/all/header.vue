<template>
  <div class="mp-header" :class="{ 'with-shadow': withShadow }">
    <div class="header-left">
      <div 
        v-if="shouldShowBack" 
        class="back-button" 
        @click="goBack"
      >
        ‹
      </div>
    </div>
    
    <div class="header-title" :class="{ 'can-scroll': isLongTitle }">
      <span ref="titleRef">{{ title }}</span>
    </div>
    
    <div class="header-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

interface Props {
  title: string;
  showBack?: boolean;
  withShadow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '道威系统',
  showBack: true,
  withShadow: true
});

const router = useRouter();
const route = useRoute();
const titleRef = ref<HTMLElement | null>(null);
const isLongTitle = ref(false);

// 判断是否显示返回按钮
const shouldShowBack = computed(() => {
  if (!props.showBack) return false;
  
  const path = route.path;
  // 只在工具页面显示返回按钮
  return path.startsWith('/user/tools/') || path.startsWith('/admin/tools/');
});

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// 检查标题长度
const checkTitleLength = () => {
  if (titleRef.value) {
    const titleWidth = titleRef.value.scrollWidth;
    const containerWidth = titleRef.value.offsetWidth;
    isLongTitle.value = titleWidth > containerWidth;
  }
};

// 监听标题变化
watch(() => props.title, () => {
  nextTick(() => {
    checkTitleLength();
  });
});

onMounted(() => {
  checkTitleLength();
});
</script>

<style scoped>
.mp-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: var(--header-bg, rgba(255, 255, 255, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  z-index: 100;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mp-header.with-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-left {
  position: absolute;
  left: 16px;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #333333;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-weight: 300;
  font-size: 32px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1;
  margin-left: -8px;
}

.back-button:active {
  opacity: 0.7;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-color, #333);
  text-align: center;
  max-width: 60%;
  padding: 0 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-title.can-scroll {
  animation: scrollText 8s linear infinite;
}

.header-right {
  position: absolute;
  right: 16px;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 滚动文字动画 */
@keyframes scrollText {
  0%, 10% {
    transform: translateX(0);
  }
  90%, 100% {
    transform: translateX(calc(-100% + 200px));
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mp-header {
    --header-bg: rgba(18, 18, 18, 0.95);
    --text-color: #fff;
    --primary-color: #42d392;
  }
  
  .back-button {
    color: #ffffff;
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .mp-header {
    padding-top: max(env(safe-area-inset-top), 0px);
    height: calc(44px + env(safe-area-inset-top, 0px));
  }
}
</style>