<template>
  <div class="pagination-container">
    <span class="pagination-text">总数：{{ total }}条数据</span>
    <el-select :model-value="pageSize" class="page-size-select" @change="handlePageSizeChange">
      <el-option v-for="size in pageSizes" :key="size" :label="`${size}条/页`" :value="size" />
    </el-select>
    <el-pagination 
      :current-page="currentPage" 
      :page-size="pageSize" 
      :total="total" 
      layout="pager"
      :pager-count="5" 
      class="custom-pager" 
      @current-change="handleCurrentChange" 
    />
    <span class="pagination-text">去到</span>
    <el-input 
      v-model="jumpPageInput" 
      class="page-jumper" 
      placeholder="页码" 
      type="number" 
      :min="1"
      :max="maxPage" 
      @keyup.enter="handleJumpPage" 
    />
    <span class="pagination-text">页</span>
    <el-button type="primary" class="go-btn" @click="handleJumpPage">Go</el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'page-change', 'size-change']);

const jumpPageInput = ref('');

const maxPage = computed(() => Math.ceil(props.total / props.pageSize) || 1);

const handlePageSizeChange = (size) => {
  emit('update:pageSize', size);
  emit('update:currentPage', 1);
  emit('size-change', size);
};

const handleCurrentChange = (page) => {
  emit('update:currentPage', page);
  emit('page-change', page);
};

const handleJumpPage = () => {
  const page = Number(jumpPageInput.value);
  if (page >= 1 && page <= maxPage.value) {
    emit('update:currentPage', page);
    emit('page-change', page);
  }
  jumpPageInput.value = '';
};
</script>

<style scoped>
.pagination-container {
  position: fixed;
  left: 220px;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  padding: 12px 20px;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  z-index: 999;
}

.pagination-text {
  font-size: 14px;
  color: #606266;
}

.page-size-select {
  width: 120px;
}

.page-jumper {
  width: 80px;
}

.go-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
  border-radius: 4px;
}

.custom-pager :deep(.el-pager li.is-active) {
  background-color: #409eff;
  color: #fff;
}
</style>
