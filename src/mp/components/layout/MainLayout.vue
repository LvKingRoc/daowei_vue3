<template>
  <div class="app-wrapper">
    <Header v-if="showHeader" :title="title" :showBack="showBack" :showRefresh="showRefresh" />
    
    <div class="app-container">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </div>

    <Menu v-if="!hideMenu" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from './Header.vue';
import Menu from './Menu.vue';

const route = useRoute();
const title = computed(() => route.meta.title || '道威管理系统');
const isRoot = computed(() => {
  const rootPaths = [
    '/user/home',
    '/admin/home',
    '/user/management',
    '/admin/management',
    '/user/tools',
    '/admin/tools',
    '/user/support',
    '/admin/support'
  ];
  return rootPaths.includes(route.path);
});

const showBack = computed(() => {
  if (typeof route.meta.showBack === 'boolean') {
    return route.meta.showBack;
  }
  // 一级页面不显示返回，其余页面默认有返回
  return !isRoot.value;
});

const showHeader = computed(() => route.meta.hideHeader !== true);
const hideMenu = computed(() => route.meta.hideMenu);
const showRefresh = computed(() => route.meta.showRefresh === true);

// 路由过渡动画
const router = useRouter();
const transitionName = ref('slide-right');

// 监听路由变化，根据导航方向设置动画
let historyCount = 0;
const historyStack = [];

watch(() => route.path, (to, from) => {
  const toIndex = historyStack.indexOf(to);
  
  if (toIndex > -1) {
    // 返回操作：页面从左边滑入
    historyStack.splice(toIndex + 1);
    transitionName.value = 'slide-right';
  } else {
    // 前进操作：页面从右边滑入
    historyStack.push(to);
    transitionName.value = 'slide-left';
  }
});

// 初始化
historyStack.push(route.path);
</script>

<style scoped lang="scss">
.app-wrapper {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.app-container {
  min-height: calc(100vh - 100px);
}

// 简单的淡入淡出动画
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.15s ease;
}

.slide-left-enter-from,
.slide-left-leave-to,
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
}
</style>
