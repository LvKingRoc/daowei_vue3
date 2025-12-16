<template>
  <div v-if="tabs.length" class="sub-menu">
    <van-tabs
      v-model:active="active"
      type="line"
      swipeable
      @click-tab="onClickTab"
    >
      <van-tab
        v-for="tab in tabs"
        :key="tab.path"
        :title="tab.title"
        :name="tab.path"
      />
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 当前父级路由记录（包含子路由的那一层，例如 /user/management 或 /admin/tools）
const parentRecord = computed(() => {
  const matched = route.matched;
  if (!matched.length) return null;

  const last = matched[matched.length - 1];
  if (last.children && last.children.length) {
    return last;
  }

  if (matched.length > 1) {
    const prev = matched[matched.length - 2];
    if (prev.children && prev.children.length) {
      return prev;
    }
  }

  return null;
});

// 根据父路由的 children 自动生成二级菜单
const tabs = computed(() => {
  const parent = parentRecord.value;
  if (!parent || !parent.children) return [];

  const basePath = parent.path.replace(/\/$/, '');

  return parent.children
    .filter((child) => child.meta && child.meta.title && !child.meta.hiddenInSubMenu)
    .map((child) => {
      const segment = child.path || '';
      const fullPath = segment.startsWith('/') ? segment : `${basePath}/${segment}`;
      return {
        title: child.meta.title,
        path: fullPath
      };
    });
});

const active = ref('');

// 路由变化时，同步当前激活的 tab
watch(
  () => [route.path, tabs.value],
  ([newPath]) => {
    const list = tabs.value || [];
    if (!list.length) {
      active.value = '';
      return;
    }

    const current = list.find(
      (tab) => newPath === tab.path || newPath.startsWith(`${tab.path}/`)
    );

    active.value = (current || list[0]).path;
  },
  { immediate: true }
);

// 仅在用户点击 tab 时进行路由跳转，避免循环导航
const onClickTab = ({ name }) => {
  if (!name || name === route.path) return;
  router.replace(name);
};
</script>

<style scoped>
.sub-menu {
  background-color: #ffffff;
}
</style>
