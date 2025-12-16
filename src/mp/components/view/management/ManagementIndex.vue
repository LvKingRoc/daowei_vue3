<template>
  <div class="page">
    <!-- 头部 -->
    <div class="page-hero">
      <h1>管理中心</h1>
      <p>企业一站式管理</p>
    </div>

    <!-- 功能列表 -->
    <div class="menu-list">
      <div
        v-for="(item, index) in items"
        :key="item.path"
        class="menu-item"
        @click="go(item.path)"
      >
        <div class="menu-icon" :class="'theme-' + (index % 5)">
          <van-icon :name="getIcon(index)" size="20" />
        </div>
        <div class="menu-content">
          <span class="menu-title">{{ item.title }}</span>
          <span v-if="item.label" class="menu-desc">{{ item.label }}</span>
        </div>
        <van-icon name="arrow" class="menu-arrow" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 当前管理入口的基础路径，例如 /user/management 或 /admin/management
const basePath = computed(() => {
  const segments = route.path.split('/');
  if (segments.length >= 3) {
    return `/${segments[1]}/${segments[2]}`;
  }
  return route.path;
});

// 从整个路由表中自动收集当前管理模块下的子页面
const items = computed(() => {
  const base = basePath.value;
  const allRoutes = router.getRoutes();

  return allRoutes
    .filter(
      (r) =>
        r.path.startsWith(`${base}/`) &&
        r.meta &&
        r.meta.title &&
        !r.meta.hiddenInMenu
    )
    .map((r) => ({
      title: r.meta.title,
      label: r.meta.description || '',
      path: r.path
    }));
});

const go = (path) => {
  if (!path || path === route.path) return;
  router.push(path);
};

const icons = ['friends-o', 'manager-o', 'orders-o', 'photo-o', 'user-o'];
const getIcon = (index) => icons[index % icons.length];
</script>

<style scoped>
.page {
  min-height: calc(100vh - 96px);
  background: #fff;
  padding-bottom: 20px;
}

/* 头部 */
.page-hero {
  text-align: center;
  padding: 24px 20px 20px;
  background: linear-gradient(180deg, #f0fdfa 0%, #fff 100%);
}

.hero-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #fff;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(15, 118, 110, 0.15);
}

.page-hero h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.page-hero p {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

/* 菜单列表 */
.menu-list {
  padding: 0 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}

.menu-item:active {
  transform: scale(0.98);
  background: #fafafa;
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 14px;
  flex-shrink: 0;
}

.theme-0 {
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
}

.theme-1 {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
}

.theme-2 {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.theme-3 {
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
}

.theme-4 {
  background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%);
}

.menu-content {
  flex: 1;
  min-width: 0;
}

.menu-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.menu-desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}

.menu-arrow {
  color: #d1d5db;
  margin-left: 8px;
}
</style>
