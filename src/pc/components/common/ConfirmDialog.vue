<template>
  <el-dialog 
    v-model="visible" 
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <div class="confirm-dialog">
      <!-- 图标区域 -->
      <div class="confirm-icon" :class="typeClass">
        <el-icon :size="48">
          <WarningFilled v-if="type === 'warning'" />
          <CircleCloseFilled v-if="type === 'danger'" />
          <InfoFilled v-if="type === 'info'" />
          <SuccessFilled v-if="type === 'success'" />
        </el-icon>
      </div>
      
      <!-- 消息区域 -->
      <div class="confirm-content">
        <div class="confirm-message">{{ message }}</div>
        
        <!-- 详情插槽 -->
        <div v-if="$slots.details" class="confirm-details">
          <slot name="details"></slot>
        </div>
        
        <!-- 警告提示 -->
        <div v-if="warning" class="confirm-warning">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ warning }}</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="confirm-footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button :type="confirmButtonType" @click="handleConfirm" :loading="loading">
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { WarningFilled, CircleCloseFilled, InfoFilled, SuccessFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: '确定要执行此操作吗？'
  },
  warning: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info, success
    validator: (val) => ['warning', 'danger', 'info', 'success'].includes(val)
  },
  width: {
    type: String,
    default: '420px'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const typeClass = computed(() => `type-${props.type}`);

const confirmButtonType = computed(() => {
  return props.type === 'danger' ? 'danger' : 'primary';
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
  visible.value = false;
};
</script>

<style scoped>
.confirm-dialog {
  padding: 24px 24px 8px;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-icon.type-warning {
  color: #e6a23c;
}

.confirm-icon.type-danger {
  color: #f56c6c;
}

.confirm-icon.type-info {
  color: #909399;
}

.confirm-icon.type-success {
  color: #67c23a;
}

.confirm-content {
  color: #606266;
}

.confirm-message {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.confirm-details {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 12px 0;
  text-align: left;
  font-size: 14px;
  line-height: 1.8;
}

.confirm-details :deep(p) {
  margin: 4px 0;
}

.confirm-details :deep(strong) {
  color: #303133;
}

.confirm-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #f56c6c;
  font-size: 13px;
  margin-top: 12px;
}

.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
