<template>
  <el-dialog 
    v-model="visible" 
    :title="currentStep === 1 ? title : '二次确认'"
    :width="width"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
    @closed="handleClosed"
  >
    <!-- 第一步：基本确认 -->
    <div v-if="currentStep === 1" class="confirm-dialog">
      <div class="confirm-icon type-danger">
        <el-icon :size="48"><WarningFilled /></el-icon>
      </div>
      
      <div class="confirm-content">
        <div class="confirm-message">{{ message }}</div>
        
        <!-- 详情插槽 -->
        <div v-if="$slots.details" class="confirm-details">
          <slot name="details"></slot>
        </div>
        
        <div class="confirm-warning">
          <el-icon><WarningFilled /></el-icon>
          <span>此操作不可恢复，请谨慎操作！</span>
        </div>
      </div>
    </div>
    
    <!-- 第二步：二次确认（显示关联数据） -->
    <div v-else class="confirm-dialog second-step">
      <div class="second-step-icon">
        <el-icon :size="56" color="#f56c6c"><CircleCloseFilled /></el-icon>
      </div>
      
      <div class="second-step-title">重要提醒！</div>
      
      <div class="second-step-content">
        <slot name="secondStepContent">
          <div v-if="relatedData.length" class="related-list">
            <div v-for="(item, index) in relatedData" :key="index" class="related-item">
              {{ item.label }}：<span class="danger-text">{{ item.count }}</span> {{ item.unit || '条' }}
            </div>
          </div>
        </slot>
        
        <div class="second-step-warning">
          所有相关数据将被<span class="danger-text">永久删除</span>，确定要继续吗？
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="confirm-footer">
        <el-button @click="handleCancel">
          {{ currentStep === 1 ? '取消' : '返回' }}
        </el-button>
        <el-button type="danger" @click="handleConfirm" :loading="loading">
          {{ currentStep === 1 ? '确定删除' : '确认删除' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认删除'
  },
  message: {
    type: String,
    default: '确定要删除此项吗？'
  },
  width: {
    type: String,
    default: '420px'
  },
  // 是否需要二次确认
  requireSecondConfirm: {
    type: Boolean,
    default: true
  },
  // 关联数据列表 [{label: '样品', count: 5, unit: '个'}]
  relatedData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const currentStep = ref(1);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 重置步骤
watch(() => props.modelValue, (val) => {
  if (val) {
    currentStep.value = 1;
  }
});

const handleConfirm = () => {
  if (props.requireSecondConfirm && currentStep.value === 1) {
    // 进入二次确认
    currentStep.value = 2;
  } else {
    // 最终确认
    emit('confirm');
  }
};

const handleCancel = () => {
  if (currentStep.value === 2) {
    // 返回第一步
    currentStep.value = 1;
  } else {
    emit('cancel');
    visible.value = false;
  }
};

const handleClosed = () => {
  currentStep.value = 1;
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

.confirm-icon.type-danger {
  color: #e6a23c;
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

/* 二次确认样式 */
.second-step {
  padding: 32px 24px 16px;
}

.second-step-icon {
  margin-bottom: 16px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.second-step-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.second-step-content {
  color: #606266;
}

.related-list {
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%);
  border: 1px solid #fde2e2;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.related-item {
  font-size: 14px;
  line-height: 2;
  color: #606266;
}

.danger-text {
  color: #f56c6c;
  font-weight: 600;
}

.second-step-warning {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
</style>
