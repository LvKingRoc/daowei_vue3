<template>
  <div class="skeleton-wrapper">
    <!-- 列表骨架屏 -->
    <template v-if="type === 'list'">
      <div v-for="i in rows" :key="i" class="skeleton-item">
        <van-skeleton :row="3" :loading="true" avatar avatar-shape="square" />
      </div>
    </template>

    <!-- 卡片骨架屏 -->
    <template v-else-if="type === 'card'">
      <div v-for="i in rows" :key="i" class="skeleton-card">
        <van-skeleton :row="2" :loading="true" title avatar />
      </div>
    </template>

    <!-- 详情骨架屏 -->
    <template v-else-if="type === 'detail'">
      <div class="skeleton-detail">
        <van-skeleton :row="6" :loading="true" title />
      </div>
    </template>

    <!-- 默认骨架屏 -->
    <template v-else>
      <van-skeleton :row="rows" :loading="true" :title="showTitle" :avatar="showAvatar" />
    </template>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default' // 'list' | 'card' | 'detail' | 'default'
  },
  rows: {
    type: Number,
    default: 3
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  showAvatar: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.skeleton-wrapper {
  padding: 16px;
}

.skeleton-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.skeleton-card {
  margin-bottom: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.skeleton-detail {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}
</style>
