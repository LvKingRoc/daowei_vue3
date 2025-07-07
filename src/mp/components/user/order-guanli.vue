<template>
  <div class="order-management">
    <!-- 自定义标题栏 -->
    <div class="custom-header">
      <div class="header-back" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div class="header-title" :class="{ 'notification-active': isNotifying }">{{ pageTitle }}</div>
      <div class="header-actions">
        <van-icon name="search" size="20" @click="toggleSearchPanel" />
        <van-icon name="sort" size="20" @click="toggleSortOrder" />
      </div>
    </div>

    <!-- 搜索面板 -->
    <transition name="slide-fade">
      <div class="search-panel" v-show="showSearchPanel">
        <div class="search-filters">
          <van-field
            v-model="searchParams.orderNumber"
            placeholder="根据订单号搜索"
            clearable
            class="search-field"
            left-icon="notes-o"
            @keyup.enter="onSearchSubmit"
          />
          <van-field
            v-model="searchParams.model"
            placeholder="根据型号搜索"
            clearable
            class="search-field"
            left-icon="label-o"
            @keyup.enter="onSearchSubmit"
          />
          <van-field
            v-model="searchParams.companyName"
            placeholder="根据客户企业搜索"
            clearable
            class="search-field"
            left-icon="shop-o"
            @keyup.enter="onSearchSubmit"
          />
          <van-field
            :model-value="searchParams.status ? statusMap[searchParams.status] : '全部状态'"
            is-link
            readonly
            label="订单状态"
            placeholder="选择订单状态"
            @click="openStatusPickerPopup('search')"
          />
          <div class="search-buttons">
            <van-button type="primary" size="small" round icon="search" @click="handleSearch">搜索</van-button>
            <van-button plain size="small" round icon="replay" @click="resetSearch">重置</van-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 订单列表 -->
    <div class="order-list" :class="{ 'list-with-search': showSearchPanel }">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh" success-text="刷新成功" head-height="80">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-empty v-if="displayItems.length === 0 && !loading" description="暂无数据" />
          <div
            v-for="item in displayItems"
            :key="item.id"
            class="order-item"
            @click="editOrder(item)"
          >
            <div class="order-image">
              <van-image
                :src="item.image ? getImageUrl(item.image) : defaultImage"
                fit="cover"
                radius="8"
                width="70"
                height="70"
              >
                <template #loading>
                  <van-loading type="spinner" size="20" />
                </template>
                <template #error>
                  <div class="image-placeholder">
                    <van-icon name="photo-o" size="24" />
                  </div>
                </template>
              </van-image>
            </div>
            <div class="order-info">
              <div class="order-number">{{ item.orderNumber }}</div>
              <div class="order-model">{{ item.model }}{{ item.colorCode ? ' - ' + item.colorCode : '' }}</div>
              <div class="order-company">{{ item.companyName || '无关联企业' }}</div>
            </div>
            <div class="order-details">
              <div class="order-quantity">
                <van-icon name="balance-list-o" color="#b2b2b2" />
                数量: {{ item.totalQuantity }}
              </div>
              <div class="order-amount">
                <van-icon name="gold-coin-o" />
                金额: {{ item.totalAmount ? '¥' + item.totalAmount.toFixed(2) : '未设置' }}
              </div>
              <div class="order-delivery-date">
                <van-icon name="underway-o" color="#1989fa" />
                交货: {{ item.deliveryDate ? formatDate(item.deliveryDate) : '未设置' }}
              </div>
              <div class="order-status" @click.stop="showQuickStatusPicker(item)">
                <van-tag :type="getStatusTagType(item.status)" :style="getStatusTagStyle(item.status)">{{ statusMap[item.status] }}</van-tag>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 浮动添加按钮已移除 -->

    <!-- 编辑弹窗 -->
    <van-popup
      v-model:show="showDialog"
      position="bottom"
      round
      closeable
      close-icon-position="top-right"
      :style="{ height: '85%' }"
    >
      <div class="dialog-title">{{ formData.id ? '编辑订单信息' : '新增订单信息' }}</div>
      <van-form @submit="validateAndSave" class="edit-form">
        <!-- 样品信息展示 -->
        <div class="sample-info-section">
          <div class="sample-info-header">
            <div class="model-info">
              <div class="label">型号</div>
              <div class="value">{{ formData.model }}</div>
            </div>
            <div class="divider"></div>
            <div class="color-info">
              <div class="label">颜色</div>
              <div class="value">{{ formData.colorCode || '无' }}</div>
            </div>
          </div>
          <div class="sample-image" @click="previewImage">
            <van-image
              :src="formData.image ? getImageUrl(formData.image) : defaultImage"
              fit="cover"
              radius="8"
              width="80"
              height="80"
            >
              <template #error>
                <div class="image-placeholder">
                  <van-icon name="photo-o" size="24" />
                </div>
              </template>
            </van-image>
            <div class="image-overlay" v-if="formData.image">
              <van-icon name="search" size="20" color="#fff" />
              <span>点击查看</span>
            </div>
          </div>
        </div>

        <!-- 表单字段 -->
        <van-cell-group inset class="form-group">
          <van-field
            v-model="formData.orderNumber"
            name="orderNumber"
            label="订单号"
            placeholder="请输入订单号"
            left-icon="notes-o"
            :rules="[{ required: true, message: '请输入订单号' }]"
          />
          <van-field
            v-model.number="formData.totalQuantity"
            name="totalQuantity"
            label="总数量"
            type="digit"
            placeholder="请输入总数量"
            left-icon="balance-list-o"
            :rules="[{ required: true, validator: quantityValidator, message: '总数量必须为大于0的整数' }]"
          />
          <van-field
            v-model.number="formData.totalAmount"
            name="totalAmount"
            label="总金额(元)"
            type="number"
            placeholder="请输入总金额"
            left-icon="gold-coin-o"
            :rules="[{ required: true, validator: amountValidator, message: '总金额必须大于0' }]"
          />
          <van-field
            id="createDateField"
            name="createDate"
            label="创建日期"
            is-link
            readonly
            left-icon="calendar-o"
            :model-value="formData.createDate"
            placeholder="请选择创建日期"
            @click="openDatePickerPopup('createDate')"
            :rules="[{ required: true, message: '请选择创建日期' }]"
          />
          <van-field
            id="deliveryDateField"
            name="deliveryDate"
            label="交货日期"
            is-link
            readonly
            left-icon="underway-o"
            :model-value="formData.deliveryDate"
            placeholder="请选择交货日期"
            @click="openDatePickerPopup('deliveryDate')"
            :rules="[{ required: true, message: '请选择交货日期' }]"
          />
          <van-field
            name="status"
            label="订单状态"
            is-link
            readonly
            left-icon="sign"
            :model-value="statusMap[formData.status]"
            placeholder="请选择订单状态"
            @click="openStatusPickerPopup('form')"
            :rules="[{ required: true, message: '请选择订单状态' }]"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" icon="success">确认保存</van-button>
          <van-button v-if="formData.id" round block type="danger" icon="delete" @click="showDeleteConfirm">删除订单</van-button>
        </div>
      </van-form>
    </van-popup>

    <!-- 状态选择器 (用于搜索和表单) -->
    <van-popup v-model:show="showStatusPicker" position="bottom" round>
      <div class="status-picker">
        <div class="status-picker-header">
          <div class="cancel-btn" @click="showStatusPicker = false">取消</div>
          <div class="title">选择订单状态</div>
          <div class="confirm-btn" @click="confirmStatus">确定</div>
        </div>
        <div class="status-list">
          <div
            v-if="statusPickerContext.mode === 'search'"
            class="status-item"
            :class="{ active: statusPickerContext.tempStatus === '' }"
            @click="statusPickerContext.tempStatus = ''"
          >
            <van-tag type="default" size="medium">全部状态</van-tag>
          </div>
          <div
            v-for="status in orderedStatuses"
            :key="status.value"
            class="status-item"
            :class="{ active: statusPickerContext.tempStatus === status.value }"
            @click="statusPickerContext.tempStatus = status.value"
          >
            <van-tag :type="getStatusTagType(status.value)" size="medium" :style="getStatusTagStyle(status.value)">{{ status.label }}</van-tag>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 (用于创建和交货日期) -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <div class="date-picker-container">
        <div class="date-picker-header">
          <div class="cancel-btn" @click="showDatePicker = false">取消</div>
          <div class="title">{{ datePickerContext.field === 'createDate' ? '选择创建日期' : '选择交货日期' }}</div>
          <div class="confirm-btn" @click="confirmDate">确定</div>
        </div>
        <vue-hash-calendar
          ref="dateCalendar"
          :scroll-change-date="true"
          :show-week-view="false"
          :is-show-week-header="true"
          :picker-type="'date'"
          :default-datetime="datePickerContext.tempDate"
          format="YY-MM-DD"
          @change="onDateChange"
        />
      </div>
    </van-popup>

    <!-- 列表项状态快速修改选择器 -->
    <van-popup v-model:show="showListItemStatusPicker" position="bottom" round>
      <div class="status-picker">
        <div class="status-picker-header">
          <div class="cancel-btn" @click="showListItemStatusPicker = false">取消</div>
          <div class="title">修改订单状态</div>
          <div class="empty-space"></div>
        </div>
        <div class="status-list">
          <div
            v-for="status in orderedStatuses"
            :key="status.value"
            class="status-item"
            :class="{ active: currentEditingItem && currentEditingItem.status === status.value }"
            @click="confirmListItemStatus(status.value)"
          >
            <van-tag :type="getStatusTagType(status.value)" size="medium" :style="getStatusTagStyle(status.value)">{{ status.label }}</van-tag>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      show-cancel-button
      confirm-button-color="#ee0a24"
      @confirm="confirmDelete"
    >
      <div class="delete-warning">
        <p>确认删除以下订单？</p>
        <p class="delete-item">订单号：{{ deleteItemData.orderNumber }}</p>
        <p class="delete-item">型号：{{ deleteItemData.model }}</p>
        <p class="delete-item">客户企业：{{ deleteItemData.companyName || '无' }}</p>
        <p class="delete-item">总金额：¥{{ deleteItemData.totalAmount?.toFixed(2) }}</p>
        <p class="delete-warning-text">
          <van-icon name="info-o" /> 此操作不可恢复，请谨慎操作！
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showImagePreview } from 'vant';
import {
  Empty,
  Loading,
  Image as VanImage,
  DropdownMenu,
  DropdownItem,
  Tag,
  Picker
} from 'vant';
import VueHashCalendar from 'vue3-hash-calendar';
import 'vue3-hash-calendar/es/index.css';
import request from '@/core/utils/request.js';
import { getApiBase, REQUEST_CONFIG, getImageUrl } from '@/config/env.js';
import pinyin from 'pinyin';
import userRoutes from '@/mp/router/main/userRoutes';

// 不需要手动注册Vant组件，直接在模板中使用

// 格式化日期函数（提前定义）
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 默认图片（灰色背景的图片占位符）
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMmYyZjIiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzk5OTk5OSI+5peg5Zu+54mHPC90ZXh0Pgo8L3N2Zz4=';

// 路由和页面标题
const route = useRoute();
const router = useRouter();
const goBack = () => router.back();
const notificationMessage = ref(''); // 添加通知消息状态
const isNotifying = ref(false); // 控制通知激活状态（用于CSS动画）

const pageTitle = computed(() => {
  // 如果有通知消息，优先显示通知消息
  if (notificationMessage.value) {
    return notificationMessage.value;
  }

  const currentRouteName = route.name;
  const userRoute = userRoutes[0];
  if (userRoute?.children) {
    const childRoute = userRoute.children.find(child => child.name === currentRouteName);
    if (childRoute?.meta?.title) return childRoute.meta.title;
  }
  return route.meta.title || '订单管理';
});

// 显示通知的函数
const showTitleNotification = (message, duration = 2000) => {
  notificationMessage.value = message;
  isNotifying.value = true;
  setTimeout(() => {
    notificationMessage.value = '';
    isNotifying.value = false;
  }, duration);
};

// 订单状态映射
const statusMap = {
  PENDING: '待生产',
  IN_PROGRESS: '生产中',
  READY_TO_SHIP: '待发货',
  AWAITING_PAYMENT: '待收款',
  COMPLETED: '已完成'
};

// 状态排序权重
const statusOrder = {
  PENDING: 1,
  IN_PROGRESS: 2,
  READY_TO_SHIP: 3,
  AWAITING_PAYMENT: 4,
  COMPLETED: 5
};

// 按顺序排列的状态列表
const orderedStatuses = computed(() => [
  { value: 'PENDING', label: statusMap.PENDING },
  { value: 'IN_PROGRESS', label: statusMap.IN_PROGRESS },
  { value: 'READY_TO_SHIP', label: statusMap.READY_TO_SHIP },
  { value: 'AWAITING_PAYMENT', label: statusMap.AWAITING_PAYMENT },
  { value: 'COMPLETED', label: statusMap.COMPLETED }
]);

// 状态选择器 (用于表单和搜索)
const showStatusPicker = ref(false);
const statusPickerContext = ref({ mode: 'form', tempStatus: '' });

const openStatusPickerPopup = (mode) => {
  statusPickerContext.value.mode = mode;
  statusPickerContext.value.tempStatus = mode === 'search' ? searchParams.status : formData.value.status;
  showStatusPicker.value = true;
};

const confirmStatus = () => {
  if (statusPickerContext.value.mode === 'search') {
    searchParams.status = statusPickerContext.value.tempStatus;
    handleSearch();
  } else {
    formData.value.status = statusPickerContext.value.tempStatus;
  }
  showStatusPicker.value = false;
};

// 获取状态标签类型
const getStatusTagType = (status) => ({
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  READY_TO_SHIP: 'success',
  AWAITING_PAYMENT: 'danger',
  COMPLETED: 'primary'
}[status] || 'default');

const getStatusTagStyle = (status) =>
  status === 'COMPLETED' ? { background: '#000', color: '#fff' } : {};

// 搜索关闭输入法
const onSearchSubmit = (event) => {
  if (event.key === 'Enter') {
    event.target.blur(); // 关闭输入法
    handleSearch(); // 执行搜索
  }
};

// 拼音搜索工具函数
const getPinyin = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');
};

const getPinyinInitials = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');
};

// 状态定义
const items = ref([]);
const displayItems = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const pageSize = ref(10);
const currentPage = ref(1);

// 日期选择器
const showDatePicker = ref(false);
const datePickerContext = ref({ field: '', tempDate: new Date() });

const openDatePickerPopup = (field) => {
  const isCreate = field === 'createDate';
  const dateStr = isCreate ? formData.value.createDate : formData.value.deliveryDate;

  let defaultDate = new Date();
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    defaultDate = new Date(year, month - 1, day);
  } else if (!isCreate) {
    defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 交货日期默认一周后
  }

  datePickerContext.value = { field, tempDate: defaultDate };
  nextTick(() => {
    showDatePicker.value = true;
  });
};

const onDateChange = (date) => {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    datePickerContext.value.tempDate = new Date(year, month - 1, day);
  } else {
    datePickerContext.value.tempDate = date;
  }
};

const confirmDate = () => {
  const { field, tempDate } = datePickerContext.value;
  if (field) {
    formData.value[field] = formatDate(tempDate);
  }
  showDatePicker.value = false;
};

// 图片预览
const previewImage = (e) => {
  e.stopPropagation(); // 阻止事件冒泡，防止触发编辑表单
  if (formData.value.image) {
    const imageUrl = getImageUrl(formData.value.image);
    showImagePreview({
      images: [imageUrl],
      closeable: true,
      showIndex: false
    });
  }
};

// 列表项快速状态选择器
const showListItemStatusPicker = ref(false);
const currentEditingItem = ref(null);

// 打开列表项状态选择器
const showQuickStatusPicker = (item) => {
  currentEditingItem.value = item;
  showListItemStatusPicker.value = true;
};

// 直接修改列表项状态
const updateOrderStatus = async (item, newStatus) => {
  if (!item || newStatus === item.status) {
    return;
  }

  try {
    const updateData = { ...item, status: newStatus };
    const response = await request.put(`/orders/${item.id}`, updateData);
    item.status = newStatus;
    showTitleNotification(response.message);
  } catch (error) {
    showToast(error.response?.data?.message || '状态更新失败');
  }
};

// 点击状态项直接更新
const confirmListItemStatus = async (status) => {
  const item = currentEditingItem.value;
  await updateOrderStatus(item, status);
  showListItemStatusPicker.value = false;
};

// 搜索相关
const showSearchPanel = ref(false);
const searchParams = reactive({
  orderNumber: '',
  model: '',
  companyName: '',
  status: '',
});

// 编辑相关
const showDialog = ref(false);
const formData = ref(getDefaultFormData());

// 删除相关
const showDeleteDialog = ref(false);
const deleteItemData = ref({
  id: null,
  orderNumber: '',
  model: '',
  companyName: '',
  totalAmount: 0
});

// 工具函数
function getDefaultFormData() {
  return {
    id: null,
    orderNumber: '',
    sampleId: null,
    model: '',
    colorCode: '',
    companyName: '',
    image: null,
    totalQuantity: 0,
    totalAmount: 0,
    createDate: formatDate(new Date()),
    deliveryDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 默认交货日期为一周后
    status: 'PENDING'
  };
}

// 自定义校验器
const quantityValidator = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

const amountValidator = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num > 0;
};

// 搜索相关
const toggleSearchPanel = () => showSearchPanel.value = !showSearchPanel.value;

const handleSearch = () => {
  currentPage.value = 1;
  loadFilteredItems();
  showSearchPanel.value = false; // 搜索后关闭搜索面板
};

const resetSearch = () => {
  searchParams.orderNumber = '';
  searchParams.model = '';
  searchParams.companyName = '';
  searchParams.status = '';
  currentPage.value = 1;
  loadFilteredItems();
};

// 搜索过滤函数
const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toString().toLowerCase();
  return textLower.includes(searchLower) ||
         getPinyin(text).toLowerCase().includes(searchLower) ||
         getPinyinInitials(text).toLowerCase().includes(searchLower);
};

const filteredItems = computed(() => {
  let filtered = items.value;

  if (searchParams.orderNumber) {
    filtered = filtered.filter(item => matchesSearch(item.orderNumber, searchParams.orderNumber));
  }

  if (searchParams.model) {
    filtered = filtered.filter(item => matchesSearch(item.model, searchParams.model));
  }

  if (searchParams.companyName) {
    filtered = filtered.filter(item => matchesSearch(item.companyName, searchParams.companyName));
  }

  if (searchParams.status) {
    filtered = filtered.filter(item => item.status === searchParams.status);
  }

  return filtered;
});

// 列表加载
const onLoad = () => {
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value;

    const newItems = filteredItems.value.slice(start, start + pageSize.value);
    displayItems.value.push(...newItems);

    loading.value = false;
    currentPage.value++;

    if (displayItems.value.length >= filteredItems.value.length) {
      finished.value = true;
    }
  }, 300); // 增加一个小的延迟以改善用户体验
};

const loadFilteredItems = () => {
  currentPage.value = 1;
  finished.value = false;
  displayItems.value = [];
  loading.value = true;
  onLoad();
};

const onRefresh = () => refreshData(true);

const refreshData = async (isManual = false) => {
  try {
    await loadOrders();
    loadFilteredItems();
    if (isManual) {
      showTitleNotification('刷新成功');
    }
  } catch (error) {
    // 错误已在 loadOrders 中处理
  } finally {
    if (isManual) {
      refreshing.value = false;
    }
  }
};

const loadOrders = async () => {
  try {
    const response = await request.get('/orders');
    items.value = response.data || [];
    applySorting(); // 加载后应用当前排序
  } catch (error) {
    showToast(error.response?.data?.message || '加载订单列表失败');
    throw error; // 抛出错误以便调用方可以捕获
  }
};

// 表单操作
const addOrder = async () => {
  // 检查是否有样品ID参数，用于快速创建订单
  const sampleId = route.query.sampleId;
  if (sampleId) {
    try {
      const response = await request.get(`/samples/${sampleId}`);
      const sample = response.data;
      formData.value = {
        id: null,
        orderNumber: '',
        sampleId: sampleId,
        model: sample.model,
        colorCode: sample.colorCode,
        companyName: sample.companyName,
        image: sample.image,
        totalQuantity: 0,
        totalAmount: sample.unitPrice || 0,
        createDate: formatDate(new Date()),
        deliveryDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: 'PENDING'
      };
    } catch (error) {
      formData.value = getDefaultFormData();
      showToast('获取样品信息失败');
    }
  } else {
    formData.value = getDefaultFormData();
  }

  showDialog.value = true;
};

const editOrder = async (order) => {
  try {
    const response = await request.get(`/orders/${order.id}`);
    formData.value = {
      ...response.data,
      createDate: formatDate(response.data.createDate),
      deliveryDate: formatDate(response.data.deliveryDate)
    };

    showDialog.value = true;
  } catch (error) {
    showToast('获取订单详情失败');
  }
};

// 保存和删除
const validateAndSave = async () => {
  try {
    const payload = {
      orderNumber: formData.value.orderNumber,
      sampleId: formData.value.sampleId,
      totalQuantity: formData.value.totalQuantity,
      totalAmount: parseFloat(formData.value.totalAmount),
      createDate: formData.value.createDate,
      deliveryDate: formData.value.deliveryDate,
      status: formData.value.status || 'PENDING'
    };

    const editedId = formData.value.id;
    const endpoint = editedId ? `/orders/${editedId}` : '/orders';
    const method = editedId ? request.put : request.post;

    const response = await method(endpoint, payload);

    showTitleNotification(response.message);

    showDialog.value = false;
    refreshData(); // 保存成功后刷新列表
  } catch (error) {
    showToast(error.response?.data?.message || '保存失败，请检查数据');
  }
};

const showDeleteConfirm = () => {
  try {
    deleteItemData.value = {
      id: formData.value.id,
      orderNumber: formData.value.orderNumber,
      model: formData.value.model,
      companyName: formData.value.companyName,
      totalAmount: formData.value.totalAmount
    };

    showDeleteDialog.value = true;
  } catch (error) {
    showToast('准备删除订单失败');
  }
};

const confirmDelete = async () => {
  try {
    const { id } = deleteItemData.value;
    const response = await request.delete(`/orders/${id}`);

    showTitleNotification(response.message);

    showDialog.value = false;
    showDeleteDialog.value = false;
    refreshData(); // 删除成功后刷新列表
  } catch (error) {
    showToast(error?.response?.data?.message || '删除失败');
  }
};

// 排序状态
const sortOrder = ref('asc'); // 'asc' for ascending, 'desc' for descending

// 应用排序
const applySorting = () => {
  items.value.sort((a, b) => {
    const statusA = statusOrder[a.status] || 99;
    const statusB = statusOrder[b.status] || 99;

    if (sortOrder.value === 'asc') {
      return statusA - statusB;
    } else {
      return statusB - statusA;
    }
  });
};

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  const message = `已切换为状态${sortOrder.value === 'asc' ? '正序' : '倒序'}排列`;
  showTitleNotification(message);
  applySorting();
  loadFilteredItems(); // 排序后重新加载显示列表
};

// 暴露方法
defineExpose({
  toggleSearchPanel,
  addOrder,
  goBack
});

// 初始化
onMounted(async () => {
  await refreshData();

  // 检查URL参数中是否有sampleId，如果有则自动弹出新增订单弹窗
  if (route.query.sampleId) {
    addOrder();
  }
});
</script>

<style scoped>
.order-management {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
  position: relative;
}

/* 标题栏 */
.custom-header {
  position: sticky;
  top: 0;
  z-index: 102;
  height: 50px;
  background: linear-gradient(to right, #07c160, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  color: #fff;
}

.header-back {
  position: absolute;
  left: 16px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  transition: all 0.3s ease-in-out;
}

.header-actions {
  position: absolute;
  right: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

.header-actions i, .header-actions .van-icon {
  font-size: 20px;
  cursor: pointer;
}

/* 搜索面板 */
.search-panel {
  background-color: #fff;
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 101;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px; /* 适当增加高度以容纳所有搜索项 */
  overflow: hidden;
}

.search-filters {
  padding: 20px 16px;
}

.search-field {
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.search-field:deep(.van-field__left-icon) {
  color: #07c160;
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 10px;
}

/* 过渡动画 */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 订单列表 */
.order-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  margin-top: 0;
  transition: margin-top 0.3s ease;
}

.list-with-search {
  margin-top: 350px; /* 根据实际搜索面板高度调整 */
}

.order-list:deep(.van-pull-refresh__head) {
  color: #07c160;
}

.order-item {
  display: flex;
  background-color: #fff;
  margin-bottom: 12px;
  padding: 16px;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.order-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.order-image {
  width: 70px;
  height: 70px;
  margin-right: 16px;
  flex-shrink: 0;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 8px;
}

.order-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.order-number, .order-model, .order-company {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-number {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.order-model {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.order-company {
  font-size: 12px;
  color: #969799;
}

.order-details {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.order-quantity, .order-amount, .order-delivery-date {
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  gap: 4px;
}

.order-status {
  margin-top: -7px;
}

/* 状态选择器样式 */
.status-picker {
  padding: 16px;
}

.status-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebedf0;
}

.cancel-btn, .confirm-btn {
  font-size: 15px;
  padding: 4px 8px;
}

.cancel-btn {
  color: #969799;
}

.confirm-btn {
  color: #07c160;
  font-weight: 500;
}

.status-picker-header .title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}
.empty-space {
  width: 44px; /* for alignment */
}

.status-list {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  padding: 8px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
}

.status-item.active {
  background-color: #f2f9f5;
}

/* 日期选择器样式 */
.date-picker-container {
  padding-bottom: 20px;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
}

.date-picker-header .cancel-btn, .date-picker-header .confirm-btn {
  font-size: 14px;
  padding: 0 15px;
  cursor: pointer;
}

.date-picker-header .cancel-btn {
  color: #969799;
}

.date-picker-header .confirm-btn {
  color: #1989fa;
  font-weight: 500;
}

.date-picker-header .title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

/* 覆盖vue-hash-calendar的默认样式 */
:deep(.hash-calendar) {
  --calendar-height: 350px;
}

:deep(.calendar-header) {
  height: 50px;
}

:deep(.calendar-content) {
  height: 300px;
}

/* 弹窗表单 */
.dialog-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  margin: 20px 0;
  color: #323233;
}

.edit-form {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 0 16px 24px;
}

.sample-info-section {
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sample-info-header {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  margin-bottom: 16px;
}

.model-info, .color-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
}

.divider {
  width: 1px;
  height: 40px;
  background-color: #e8e8e8;
}

.label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.value {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.sample-image {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.sample-image:hover .image-overlay {
  opacity: 1;
}

.image-overlay span {
  color: #fff;
  font-size: 12px;
  margin-top: 4px;
}

.form-group {
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.form-group:deep(.van-field) {
  padding: 14px 16px;
}

.form-group:deep(.van-field__left-icon) {
  color: #07c160;
  font-size: 18px;
  margin-right: 10px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;
}

/* 删除确认弹窗 */
.delete-warning {
  padding: 20px;
  text-align: center;
}

.delete-item {
  margin: 10px 0;
  font-size: 15px;
  color: #646566;
}

.delete-warning-text {
  margin-top: 16px;
  color: #ee0a24;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 通知消息样式 */
.header-title.notification-active {
  color: #ffeb3b; /* 醒目的黄色 */
  font-weight: bold;
  transform: scale(1.05);
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
}
</style> 