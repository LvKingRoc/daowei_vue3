<template>
  <div class="order-management">
    <!-- 顶部导航已在 MainLayout 中处理，但如果需要特定操作按钮，可以加 -->
    
    <!-- 搜索区域 -->
    <van-sticky :offset-top="46">
      <div class="search-bar-container" :class="{ 'search-bar-hidden': !showSearchBar }">
        <div class="search-bar">
          <div class="search-type-selector" @click="showSearchTypePopover = true">
            <span class="search-type-label">{{ currentSearchTypeLabel }}</span>
            <van-icon name="arrow-down" class="search-type-arrow" />
          </div>

          <van-field
            v-model="searchKeyword"
            class="search-input"
            :placeholder="'搜索' + currentSearchTypeLabel"
            clearable
            @keyup.enter="onSearch"
            @clear="onCancelSearch"
          />

          <van-button type="primary" size="small" class="search-button" @click="onSearch">
            搜索
          </van-button>
        </div>

        <van-popup v-model:show="showSearchTypePopover" position="top" round>
          <div class="search-type-popup">
            <div
              v-for="item in searchTypeActions"
              :key="item.value"
              class="search-type-item"
              :class="{ active: item.value === searchType }"
              @click="onSearchTypeSelect(item)"
            >
              {{ item.text }}
            </div>
          </div>
        </van-popup>
        
        <van-dropdown-menu>
          <van-dropdown-item v-model="searchStatus" :options="statusOptions" @change="onSearch" />
          <van-dropdown-item v-model="sortType" :options="sortOptions" @change="onSearch" />
        </van-dropdown-menu>
      </div>
    </van-sticky>

    <!-- 列表区域 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
        <div v-for="item in list" :key="item.id" class="order-item">
          <van-swipe-cell>
            <div class="order-card" @click="showDetail(item)">
              <div class="order-thumb" v-if="item.image" @click.stop="previewImage(item.image)">
                <van-image
                  :src="getImageUrl(item.image)"
                  fit="cover"
                  width="64"
                  height="64"
                  radius="8"
                />
              </div>
              <div class="order-thumb order-thumb-empty" v-else>
                <van-icon name="notes-o" size="24" color="#cbd5f5" />
              </div>

              <div class="order-info">
                <div class="order-number">订单号：{{ item.orderNumber }}</div>
                <div class="order-company">
                  客户：{{ item.companyName || '无客户' }}
                </div>

                <div class="order-meta-row">
                  <span class="order-meta-label">型号：</span>
                  <span class="order-meta-value">{{ item.model || '无型号' }}</span>
                </div>
                <div class="order-meta-row">
                  <span class="order-meta-label">颜色：</span>
                  <span class="order-meta-value">{{ item.colorCode || '无颜色' }}</span>
                </div>

                <div class="order-metrics-row">
                  <div class="order-metric">
                    <span class="order-metric-label">数量：</span>
                    <span class="order-metric-value">{{ item.totalQuantity }}</span>
                  </div>
                  <div class="order-metric">
                    <span class="order-metric-label">金额：</span>
                    <span class="order-metric-value order-amount">
                      {{ item.totalAmount?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                </div>

                <div class="order-status-row">
                  <span class="order-status-label">状态：</span>
                  <van-tag
                    :type="getStatusTagType(item.status)"
                    size="small"
                    plain
                  >
                    {{ statusMap[item.status] || '未知' }}
                  </van-tag>
                </div>

                <div class="order-card-actions">
                  <van-button size="small" plain @click.stop="editOrder(item)">编辑</van-button>
                  <van-button size="small" type="danger" plain @click.stop="deleteOrder(item)">删除</van-button>
                </div>
              </div>
            </div>
            <template #right>
              <van-button square text="删除" type="danger" class="delete-button" @click="deleteOrder(item)" />
            </template>
          </van-swipe-cell>
        </div>
      </van-list>
    
    <!-- 编辑/新增弹窗 -->
    <van-popup v-model:show="showEditPopup" position="bottom" :style="{ height: '80%' }" round>
      <div class="popup-header">
        <span>{{ formData.id ? '编辑订单' : '新增订单' }}</span>
        <van-icon name="close" @click="showEditPopup = false" />
      </div>
      <div class="popup-content">
        <van-form @submit="onSave">
          <van-cell-group inset>
            <van-field
              v-model="formData.orderNumber"
              name="orderNumber"
              label="订单号"
              placeholder="订单号"
              :rules="[{ required: true, message: '请填写订单号' }]"
            />
            <van-field
              v-model="formData.model"
              name="model"
              label="型号"
              placeholder="型号"
              :readonly="!!formData.id"
              :disabled="!!formData.id"
            />
             <van-field
              v-model="formData.colorCode"
              name="colorCode"
              label="颜色"
              placeholder="颜色"
              :readonly="!!formData.id"
              :disabled="!!formData.id"
            />
            <van-field
              v-model="formData.totalQuantity"
              type="digit"
              name="totalQuantity"
              label="总数量"
              placeholder="总数量"
              :rules="quantityRules"
            />
            <van-field
              v-model="formData.totalAmount"
              type="number"
              name="totalAmount"
              label="总金额"
              placeholder="总金额"
              :rules="amountRules"
            />
            
            <van-field
              v-model="formData.createDate"
              is-link
              readonly
              name="createDate"
              label="创建日期"
              placeholder="点击选择日期"
              :rules="createDateRules"
              @click="showDatePicker('createDate')"
            />
            <van-field
              v-model="formData.deliveryDate"
              is-link
              readonly
              name="deliveryDate"
              label="交货日期"
              placeholder="点击选择日期"
              :rules="deliveryDateRules"
              @click="showDatePicker('deliveryDate')"
            />
            
             <van-field
              v-model="statusDisplayText"
              is-link
              readonly
              name="status"
              label="状态"
              placeholder="点击选择状态"
              @click="showStatusPicker = true"
            />

          </van-cell-group>
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePopup" position="bottom">
      <van-date-picker
        v-model="currentDatePickerValue"
        :min-date="new Date(2020, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onDateConfirm"
        @cancel="showDatePopup = false"
      />
    </van-popup>

    <!-- 状态选择器 -->
    <van-popup v-model:show="showStatusPicker" position="bottom">
      <van-picker
        :columns="statusPickerColumns"
        @confirm="onStatusConfirm"
        @cancel="showStatusPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { showToast, showDialog, showImagePreview } from 'vant';
import { useRoute } from 'vue-router';
import { orderApi } from '@/core/api/order';
import { sampleApi } from '@/core/api/sample';
import { getImageUrl } from '@/config/env.js';
import { fuzzySearch } from '@/core/utils/pinyin';
import dayjs from 'dayjs';

const isApiSuccess = (response) => {
  if (!response || response.success !== true) return false;
  if (response.code === undefined || response.code === null) return true;
  const code = Number(response.code);
  if (Number.isNaN(code)) return true;
  return code >= 200 && code < 300;
};

// --- 状态定义 ---
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const showEditPopup = ref(false);
const showDatePopup = ref(false);
const currentDatePickerValue = ref([]);
const showStatusPicker = ref(false);
const datePickerType = ref('');

// 搜索与筛选
const searchKeyword = ref('');
const searchStatus = ref('');
const sortType = ref('default');

const showSearchBar = ref(true);
const lastScrollTop = ref(0);

const searchType = ref('orderNumber');
const showSearchTypePopover = ref(false);
const searchTypeActions = [
  { text: '订单号', value: 'orderNumber' },
  { text: '型号', value: 'model' },
  { text: '企业', value: 'company' }
];

// 状态映射
const statusMap = {
  PENDING: '待生产',
  IN_PROGRESS: '生产中',
  READY_TO_SHIP: '待发货',
  AWAITING_PAYMENT: '待收款',
  COMPLETED: '已完成'
};

const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '待生产', value: 'PENDING' },
  { text: '生产中', value: 'IN_PROGRESS' },
  { text: '待发货', value: 'READY_TO_SHIP' },
  { text: '待收款', value: 'AWAITING_PAYMENT' },
  { text: '已完成', value: 'COMPLETED' }
];

const sortOptions = [
  { text: '默认排序', value: 'default' },
  { text: '金额高到低', value: 'amount_desc' },
  { text: '日期新到旧', value: 'date_desc' },
];

// 状态选择器列
const statusPickerColumns = [
  { text: '待生产', value: 'PENDING' },
  { text: '生产中', value: 'IN_PROGRESS' },
  { text: '待发货', value: 'READY_TO_SHIP' },
  { text: '待收款', value: 'AWAITING_PAYMENT' },
  { text: '已完成', value: 'COMPLETED' }
];

// 状态显示文本
const statusDisplayText = computed(() => statusMap[formData.status] || '请选择状态');

// 表单数据
const formData = reactive({
  id: null,
  orderNumber: '',
  sampleId: null,
  model: '',
  colorCode: '',
  companyName: '',
  totalQuantity: 0,
  totalAmount: 0,
  createDate: '',
  deliveryDate: '',
  status: 'PENDING'
});

// --- 校验规则 ---

const quantityRules = [
  {
    validator: (value) => {
      if (value === null || value === undefined || value === '') return false;
      const num = Number(value);
      return Number.isInteger(num) && num > 0;
    },
    message: '总数量必须为大于0的整数'
  }
];

const amountRules = [
  {
    validator: (value) => {
      if (value === null || value === undefined || value === '') return false;
      const num = Number(value);
      return num > 0;
    },
    message: '总金额必须大于0'
  }
];

const createDateRules = [
  { required: true, message: '请选择创建日期' }
];

const deliveryDateRules = [
  { required: true, message: '请选择交货日期' }
];

// --- 方法 ---

const currentSearchTypeLabel = computed(() => {
  const action = searchTypeActions.find(item => item.value === searchType.value);
  return action ? action.text : '订单号';
});

// 滚动监听 - 仅控制搜索栏显示/隐藏
const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  
  if (scrollTop <= 10) {
    showSearchBar.value = true;
    lastScrollTop.value = scrollTop;
    return;
  }
  
  const diff = scrollTop - lastScrollTop.value;
  
  if (diff > 10) {
    showSearchBar.value = false;
  } else if (diff < -10) {
    showSearchBar.value = true;
  }
  
  lastScrollTop.value = scrollTop;
};

const getStatusTagType = (status) => ({
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  READY_TO_SHIP: 'success',
  AWAITING_PAYMENT: 'danger',
  COMPLETED: 'default'
}[status] || 'default');

// 加载数据
const onLoad = async () => {
  try {
    // 模拟前端分页/搜索
    const response = await orderApi.list();
    let allItems = response.data || [];
    
    // 过滤：关键字 + 状态
    allItems = allItems.filter(item => {
      let keywordMatch = true;
      if (searchKeyword.value) {
        const kw = searchKeyword.value;
        if (searchType.value === 'orderNumber') {
          keywordMatch = fuzzySearch(item.orderNumber, kw);
        } else if (searchType.value === 'model') {
          keywordMatch = fuzzySearch(item.model, kw);
        } else if (searchType.value === 'company') {
          keywordMatch = fuzzySearch(item.companyName, kw);
        } else {
          keywordMatch =
            fuzzySearch(item.orderNumber, kw) ||
            fuzzySearch(item.model, kw) ||
            fuzzySearch(item.companyName, kw);
        }
      }

      const statusMatch = !searchStatus.value || item.status === searchStatus.value;

      return keywordMatch && statusMatch;
    });

    // 排序
    if (sortType.value === 'amount_desc') {
      allItems.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortType.value === 'date_desc') {
      allItems.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
    }

    list.value = allItems;
    finished.value = true; 

  } catch (error) {
    console.error(error);
    showToast('加载订单列表失败');
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const onRefresh = () => {
  finished.value = false;
  loading.value = true;
  onLoad();
};

const onSearch = () => {
  onRefresh();
};

const onCancelSearch = () => {
  searchKeyword.value = '';
  onRefresh();
};

const onSearchTypeSelect = (action) => {
  searchType.value = action.value;
  showSearchTypePopover.value = false;
  searchKeyword.value = '';
  onRefresh();
};

// 编辑/新增
const editOrder = (item) => {
  Object.assign(formData, item);
  // 格式化日期
  if (formData.createDate) formData.createDate = formatDate(formData.createDate);
  if (formData.deliveryDate) formData.deliveryDate = formatDate(formData.deliveryDate);
  
  showEditPopup.value = true;
};
 

const deleteOrder = (item) => {
  const message =
    `订单号：${item.orderNumber}\n` +
    `型号：${item.model || '无'}\n` +
    `客户企业：${item.companyName || '无'}\n` +
    `总金额：${item.totalAmount != null ? Number(item.totalAmount).toFixed(2) : '0.00'} 元\n\n` +
    '此操作不可恢复，请谨慎操作！';

  showDialog({
    title: '删除确认',
    message,
    showCancelButton: true,
    messageAlign: 'left',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const response = await orderApi.remove(item.id);

      if (isApiSuccess(response)) {
        showToast('删除成功');
        onRefresh();
      } else {
        showToast(response && response.message ? response.message : '删除失败');
      }
    } catch (error) {
      showToast('删除失败');
    }
  }).catch(() => {});
};

const onSave = async () => {
  try {
    const payload = { ...formData };
    payload.totalQuantity = Number(payload.totalQuantity);
    payload.totalAmount = Number(payload.totalAmount);

    let response;
    if (payload.id) {
      response = await orderApi.update(payload.id, payload);
    } else {
      response = await orderApi.create(payload);
    }

    if (isApiSuccess(response)) {
      showToast('保存成功');
      showEditPopup.value = false;
      onRefresh();
    } else {
      showToast(response && response.message ? response.message : '保存失败，请检查数据');
    }
  } catch (error) {
    showToast('保存失败，请检查数据');
  }
};

// 日期选择
const showDatePicker = (type) => {
  datePickerType.value = type;
  // 设置日期选择器的默认值
  const currentValue = type === 'createDate' ? formData.createDate : formData.deliveryDate;
  if (currentValue) {
    // 如果已有值，解析并设置
    const parts = currentValue.split('-');
    currentDatePickerValue.value = parts;
  } else {
    // 否则设置为今天
    const today = new Date();
    currentDatePickerValue.value = [
      String(today.getFullYear()),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ];
  }
  showDatePopup.value = true;
};

const onDateConfirm = ({ selectedValues }) => {
  const dateStr = selectedValues.join('-');
  if (datePickerType.value === 'createDate') {
    formData.createDate = dateStr;
  } else {
    formData.deliveryDate = dateStr;
  }
  showDatePopup.value = false;
};

// 状态选择
const onStatusConfirm = ({ selectedOptions }) => {
  formData.status = selectedOptions[0].value;
  showStatusPicker.value = false;
};

const showDetail = (item) => {
  // 可以跳转详情页，或者弹窗显示详情
};

// 预览图片
const previewImage = (imagePath) => {
  if (!imagePath) return;
  showImagePreview({
    images: [getImageUrl(imagePath)],
    closeable: true
  });
};

// 工具函数
const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

// 路由
const route = useRoute();

onMounted(async () => {
  const sampleId = route.query.sampleId;

  if (sampleId) {
    try {
      const response = await sampleApi.getById(sampleId);
      const sample = response.data || {};

      Object.assign(formData, {
        id: null,
        orderNumber: '',
        sampleId: sampleId,
        model: sample.model || '',
        colorCode: sample.colorCode || '',
        companyName: sample.companyName || '',
        totalQuantity: 0,
        totalAmount: sample.unitPrice || 0,
        createDate: formatDate(new Date()),
        deliveryDate: formatDate(new Date()),
        status: 'PENDING'
      });

      showEditPopup.value = true;
    } catch (error) {
      showToast('获取样品信息失败');
    }
  }

  onRefresh();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('mp-refresh', onRefresh);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mp-refresh', onRefresh);
});
</script>

<style scoped>
.order-management {
  min-height: calc(100vh - 96px);
  padding: 0 0 20px;
  background: #fff;
}

.search-bar-container {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  max-height: 200px;
  overflow: hidden;
}

.search-bar-hidden {
  opacity: 0;
  max-height: 0;
  pointer-events: none;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  gap: 10px;
}

.search-type-selector {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 20px;
  background: #f3f4f6;
  font-size: 13px;
  color: #374151;
  gap: 4px;
}

.search-type-label {
  font-size: 13px;
  color: #374151;
}

.search-type-arrow {
  font-size: 10px;
  color: #9ca3af;
}

.search-input {
  flex: 1;
  background: #f9fafb;
  border-radius: 10px;
}

.search-button {
  border-radius: 20px;
  padding: 0 16px;
}

.search-type-popup {
  padding: 12px 0;
}

.search-type-item {
  padding: 12px 20px;
  font-size: 15px;
  color: #374151;
}

.search-type-item.active {
  color: #f59e0b;
  font-weight: 600;
  background: #fffbeb;
}

/* 列表项 */
.order-item {
  margin: 0 16px 12px;
}

.order-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.order-thumb {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: #fffbeb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-thumb-empty {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.order-info {
  flex: 1;
  min-width: 0;
  margin-left: 14px;
}

.order-number {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  word-break: break-word;
}

.order-company {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  word-break: break-word;
}

.order-meta-row {
  display: flex;
  font-size: 13px;
  color: #6b7280;
}

.order-meta-label {
  flex-shrink: 0;
  color: #9ca3af;
}

.order-meta-value {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.order-metrics-row {
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 6px;
  font-size: 13px;
  color: #4b5563;
}

.order-metric {
  display: flex;
  align-items: baseline;
}

.order-metric-label {
  flex-shrink: 0;
  color: #9ca3af;
}

.order-metric-value {
  display: inline-block;
  width: 7ch;
  margin-left: 2px;
  color: #374151;
}

.order-amount {
  color: #f59e0b;
  font-weight: 600;
}

.order-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.order-status-label {
  flex-shrink: 0;
  color: #9ca3af;
}

.order-status-row :deep(.van-tag) {
  border-radius: 12px;
  padding: 2px 10px;
}

.order-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.order-card-actions :deep(.van-button) {
  border-radius: 20px;
  font-size: 13px;
}

.delete-button {
  height: 100%;
}

/* 弹窗 */
.popup-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}

.popup-header :deep(.van-icon) {
  font-size: 20px;
  color: #9ca3af;
}

.popup-content {
  padding: 16px 0;
  overflow-y: auto;
  height: calc(100% - 60px);
  background: #f9fafb;
}
</style>
