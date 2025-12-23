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
          <van-button 
            :type="batchMode ? 'warning' : 'default'" 
            size="small" 
            class="batch-button" 
            @click="toggleBatchMode">
            {{ batchMode ? '取消' : '批量' }}
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
          <van-swipe-cell :disabled="batchMode">
            <div class="order-card" @click="batchMode ? toggleSelectItem(item) : editOrder(item)">
              <!-- 批量选择复选框 -->
              <div v-if="batchMode" class="batch-checkbox" @click.stop="toggleSelectItem(item)">
                <van-checkbox :model-value="selectedIds.includes(item.id)" />
              </div>
              <!-- 左侧：图片 + 状态 -->
              <div class="order-left">
                <div class="order-thumb" v-if="item.image" @click.stop="previewImage(item.image)">
                  <van-image
                    :src="getImageUrl(item.image)"
                    fit="cover"
                    width="72"
                    height="72"
                    radius="12"
                  />
                </div>
                <div class="order-thumb order-thumb-empty" v-else>
                  <van-icon name="notes-o" size="28" color="#cbd5f5" />
                </div>
                <van-tag
                  :type="getStatusTagType(item.status)"
                  size="small"
                  class="order-status-tag"
                >
                  {{ statusMap[item.status] || '未知' }}
                </van-tag>
              </div>

              <!-- 右侧：订单信息 -->
              <div class="order-info">
                <!-- 订单号 -->
                <div class="order-row order-number-row">
                  <span class="order-label">订单号</span>
                  <span class="order-value order-number-value">{{ item.orderNumber }}</span>
                </div>
                
                <!-- 客户 -->
                <div class="order-row">
                  <span class="order-label">客户</span>
                  <span class="order-value">{{ item.companyName || '无客户' }}</span>
                </div>
                
                <!-- 型号 + 数量 -->
                <div class="order-row-dual">
                  <div class="order-cell">
                    <span class="order-label">型号</span>
                    <span class="order-value">{{ item.model || '无' }}</span>
                  </div>
                  <div class="order-cell">
                    <span class="order-label">数量</span>
                    <span class="order-value">{{ item.totalQuantity }}</span>
                  </div>
                </div>
                
                <!-- 颜色 + 金额 -->
                <div class="order-row-dual">
                  <div class="order-cell">
                    <span class="order-label">颜色</span>
                    <span class="order-value">{{ item.colorCode || '无' }}</span>
                  </div>
                  <div class="order-cell">
                    <span class="order-label">金额</span>
                    <span class="order-value order-amount">{{ item.totalAmount?.toFixed(2) || '0.00' }}</span>
                  </div>
                </div>
                
                <!-- 操作按钮 -->
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

    <!-- 批量操作栏 -->
    <van-action-bar v-if="batchMode" class="batch-action-bar">
      <van-action-bar-icon 
        :icon="selectedIds.length === list.length ? 'passed' : 'circle'" 
        :text="selectedIds.length === list.length ? '取消全选' : '全选'" 
        @click="toggleSelectAll" 
      />
      <van-action-bar-button 
        type="danger" 
        :text="`删除(${selectedIds.length})`" 
        :disabled="selectedIds.length === 0"
        @click="batchDeleteItems" 
      />
    </van-action-bar>
    
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
              placeholder="型号（关联样品）"
              readonly
              disabled
            />
             <van-field
              v-model="formData.colorCode"
              name="colorCode"
              label="颜色"
              placeholder="颜色（关联样品）"
              readonly
              disabled
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
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, watch } from 'vue';
import { showToast, showDialog, showImagePreview, Checkbox as VanCheckbox, ActionBar as VanActionBar, ActionBarIcon as VanActionBarIcon, ActionBarButton as VanActionBarButton } from 'vant';
import { useRoute } from 'vue-router';
import { orderApi } from '@/core/api/order';
import { sampleApi } from '@/core/api/sample';
import { getImageUrl } from '@/config/env.js';
import { fuzzySearch } from '@/core/utils/pinyin';
import dayjs from 'dayjs';
import { saveDraft, getDraft, clearDraft, hasDraft, getDraftInfo } from '@/core/utils/formDraft';

// 草稿配置
const DRAFT_NAME = 'mp_order';

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

// 批量删除状态
const batchMode = ref(false);
const selectedIds = ref([]);

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

// 批量删除相关函数
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value;
  if (!batchMode.value) {
    selectedIds.value = [];
  }
};

const toggleSelectItem = (item) => {
  const index = selectedIds.value.indexOf(item.id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(item.id);
  }
};

const toggleSelectAll = () => {
  if (selectedIds.value.length === list.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = list.value.map(item => item.id);
  }
};

const batchDeleteItems = async () => {
  if (selectedIds.value.length === 0) {
    showToast('请先选择要删除的订单');
    return;
  }

  try {
    await showDialog({
      title: '批量删除确认',
      message: `确定删除 ${selectedIds.value.length} 个订单？`,
      showCancelButton: true,
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    });

    let successCount = 0;
    let failCount = 0;
    for (const id of selectedIds.value) {
      try {
        await orderApi.remove(id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      showToast(`成功删除 ${successCount} 个订单`);
    } else {
      showToast(`删除完成：成功 ${successCount}，失败 ${failCount}`);
    }

    selectedIds.value = [];
    batchMode.value = false;
    onRefresh();
  } catch {
    // 用户取消
  }
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
      clearDraft(DRAFT_NAME);  // 提交成功后清除草稿
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

// 处理从样品页面跳转过来的下单逻辑
const handleSampleIdFromRoute = async () => {
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
};

// SSE订单数据同步监听
const handleOrderSync = (event) => {
  const { action, order } = event.detail;
  if (!order || !order.id) return;
  
  // 在列表中找到并更新该订单
  const index = list.value.findIndex(o => o.id === order.id);
  if (index !== -1) {
    // 更新列表中的订单数据
    list.value[index] = { ...list.value[index], ...order };
    showToast(`订单 ${order.orderNumber} 已被其他用户修改`);
  } else if (action === 'create') {
    // 新增的订单，添加到列表
    list.value.unshift(order);
    showToast(`新订单 ${order.orderNumber} 已创建`);
  }
};

onMounted(async () => {
  await handleSampleIdFromRoute();
  onRefresh();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('mp-refresh', onRefresh);
  window.addEventListener('order-sync', handleOrderSync);
});

// KeepAlive缓存时，每次激活都检查是否有新的sampleId
onActivated(async () => {
  await handleSampleIdFromRoute();
});

// 自动保存草稿（仅新增模式）
watch(
  () => ({ ...formData }),
  (newData) => {
    if (!newData.id && showEditPopup.value) {
      saveDraft(DRAFT_NAME, newData, { isEdit: false });
    }
  },
  { deep: true }
);

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mp-refresh', onRefresh);
  window.removeEventListener('order-sync', handleOrderSync);
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
  align-items: stretch;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  gap: 14px;
}

/* 左侧区域：图片 + 状态 */
.order-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.order-thumb {
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

.order-status-tag {
  border-radius: 10px;
  font-size: 11px;
  padding: 2px 8px;
}

/* 右侧信息区域 */
.order-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 单行信息 */
.order-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-number-row {
  margin-bottom: 2px;
}

.order-label {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
  min-width: 36px;
}

.order-value {
  font-size: 13px;
  color: #374151;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-number-value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

/* 双列布局 */
.order-row-dual {
  display: flex;
  gap: 12px;
}

.order-cell {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-amount {
  color: #f59e0b;
  font-weight: 600;
}

/* 操作按钮 */
.order-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.order-card-actions :deep(.van-button) {
  border-radius: 16px;
  font-size: 12px;
  padding: 0 12px;
  height: 28px;
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

/* 订单表单卡片 */
.order-form-card {
  margin: 0 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.order-form-card :deep(.van-field__label) {
  width: 55px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.order-form-card :deep(.van-field__control:disabled) {
  color: #6b7280;
  -webkit-text-fill-color: #6b7280;
}

/* 表单行并排 */
.form-row {
  display: flex;
}

.form-field-half {
  flex: 1;
}

.form-row :deep(.van-cell) {
  padding: 10px 12px;
}

.form-row :deep(.van-field__label) {
  width: 45px;
  font-size: 13px;
}

.form-row :deep(.van-cell::after) {
  left: 12px;
  right: 12px;
}

/* 状态选择器 */
.status-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 20px 16px;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.status-selector :deep(.van-tag) {
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 600;
}

.status-arrow {
  color: #9ca3af;
  font-size: 14px;
}

/* 表单操作按钮 */
.form-actions {
  margin: 16px;
}

.form-actions :deep(.van-button) {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 批量删除相关样式 */
.batch-button {
  border-radius: 20px;
  padding: 0 12px;
  margin-left: 8px;
}

.batch-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  margin-right: 8px;
}

.batch-action-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  z-index: 100;
}
</style>
