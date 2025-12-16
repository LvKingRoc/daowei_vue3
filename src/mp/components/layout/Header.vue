<template>
  <div class="mp-header">
    <van-nav-bar
      :title="title"
      :left-text="showBack ? '返回' : ''"
      :left-arrow="showBack"
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #right>
        <van-icon 
          v-if="showRefresh" 
          name="replay" 
          size="20" 
          class="refresh-icon"
          @click="onRefresh" 
        />
        <slot name="right"></slot>
      </template>
    </van-nav-bar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    default: '道威管理系统'
  },
  showBack: {
    type: Boolean,
    default: false
  },
  showRefresh: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const route = useRoute();

const onClickLeft = () => {
  if (props.showBack) {
    router.back();
  }
};

const onRefresh = () => {
  window.dispatchEvent(new CustomEvent('mp-refresh'));
};
</script>

<style scoped>
.mp-header {
  width: 100%;
}

:deep(.van-nav-bar) {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  z-index: 1000;
}

:deep(.van-nav-bar__title) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.van-nav-bar__text) {
  font-size: 13px;
}

.refresh-icon {
  color: #374151;
  padding: 8px;
  cursor: pointer;
}

.refresh-icon:active {
  opacity: 0.6;
}
</style>
