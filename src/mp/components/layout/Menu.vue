<template>
  <van-tabbar
    route
    active-color="#2563eb"
    inactive-color="#9ca3af"
    :border="false"
    safe-area-inset-bottom
  >
    <van-tabbar-item replace to="/user/home" icon="home-o" v-if="isUser">首页</van-tabbar-item>
    <van-tabbar-item replace to="/admin/home" icon="home-o" v-if="isAdmin">首页</van-tabbar-item>
    
    <van-tabbar-item replace :to="`/${role}/management`" icon="apps-o">管理</van-tabbar-item>
    <van-tabbar-item replace :to="`/${role}/tools`" icon="setting-o">工具</van-tabbar-item>
    <van-tabbar-item replace :to="`/${role}/support`" icon="like-o">支持</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed } from 'vue';
import { usePlatformAuthStore as useMpAuthStore } from '@/stores/platformAuth';

const authStore = useMpAuthStore();

const role = computed(() => authStore.role);
const isUser = computed(() => authStore.isUser);
const isAdmin = computed(() => authStore.isAdmin);
</script>

<style scoped>
:deep(.van-tabbar) {
  background-color: #ffffff;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.06);
}

:deep(.van-tabbar-item__icon) {
  font-size: 20px;
}

:deep(.van-tabbar-item__text) {
  font-size: 11px;
}
</style>
