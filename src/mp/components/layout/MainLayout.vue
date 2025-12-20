<template>
  <div class="app-wrapper">
    <Header v-if="showHeader" :title="title" :showBack="showBack" :showRefresh="showRefresh" />
    
    <div class="app-container">
      <router-view v-slot="{ Component }">
        <keep-alive :max="5">
          <component :is="Component" :key="$route.path" />
        </keep-alive>
      </router-view>
    </div>

    <Menu v-if="!hideMenu" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
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
  return !isRoot.value;
});

const showHeader = computed(() => route.meta.hideHeader !== true);
const hideMenu = computed(() => route.meta.hideMenu);
const showRefresh = computed(() => route.meta.showRefresh === true);
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.app-container {
  min-height: calc(100vh - 100px);
}
</style>
