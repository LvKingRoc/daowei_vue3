<template>
  <div class="sample-management">
    <!-- 自定义标题栏 -->
    <div class="custom-header">
      <div class="header-back" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div class="header-title" :class="{ 'notification-active': notification.active }">{{ pageTitle }}</div>
      <div class="header-actions">
        <van-icon name="search" size="20" @click="toggleSearchPanel" />
      </div>
    </div>
    
    <!-- 搜索面板 -->
    <transition name="slide-fade">
      <div class="search-panel" v-show="searchState.showPanel">
        <div class="search-filters">
          <van-field 
            v-model="searchState.model" 
            placeholder="根据型号搜索" 
            clearable 
            class="search-field"
            left-icon="search"
            @keyup.enter="onSearchSubmit"
          />
          <van-field 
            v-model="searchState.alias" 
            placeholder="根据别称搜索" 
            clearable 
            class="search-field"
            left-icon="label-o"
            @keyup.enter="onSearchSubmit"
          />
          <van-field 
            v-model="searchState.companyName" 
            placeholder="根据客户企业搜索" 
            clearable 
            class="search-field"
            left-icon="shop-o"
            @keyup.enter="onSearchSubmit"
          />
          <div class="search-buttons">
            <van-button type="primary" size="small" round icon="search" @click="handleSearch">搜索</van-button>
            <van-button plain size="small" round icon="replay" @click="resetSearch">重置</van-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 样板列表 -->
    <div class="sample-list" :class="{ 'list-with-search': searchState.showPanel }">
      <van-pull-refresh v-model="listState.refreshing" @refresh="onRefresh" success-text="刷新成功" head-height="80">
        <van-list
          v-model:loading="listState.loading"
          :finished="listState.finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-empty v-if="listState.displayItems.length === 0 && !listState.loading" description="暂无数据" />
          <div 
            v-for="item in listState.displayItems" 
            :key="item.id" 
            class="sample-item"
            @click="editItem(item)"
          >
            <div class="sample-image">
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
            <div class="sample-info">
              <div class="sample-model">{{ item.model }}{{ item.colorCode ? ' - ' + item.colorCode : '' }}</div>
              <div class="sample-alias">{{ item.alias || '无别称' }}</div>
              <div class="sample-company">{{ item.companyName || '无关联企业' }}</div>
            </div>
            <div class="sample-details">
              <div class="sample-stock">
                <van-icon name="certificate" color="#b2b2b2" />
                库存: {{ item.stock }}
              </div>
              <div class="sample-price">
                <van-icon name="gold-coin-o" />
                单价: {{ item.unitPrice ? '¥' + item.unitPrice : '未设置' }}
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 浮动添加按钮 -->
    <div class="floating-add-btn" 
      @click="addItem" 
      @touchstart="startDrag" 
      @touchmove="onDrag" 
      @touchend="endDrag" 
      :style="{ top: draggable.position.top + 'px', left: draggable.position.left + 'px' }">
      <van-icon name="plus" size="24" color="#fff" />
    </div>

    <!-- 编辑/新增弹窗 -->
    <van-popup
      v-model:show="editDialog.show"
      position="bottom"
      round
      closeable
      close-icon-position="top-right"
      :style="{ height: '85%' }"
    >
      <div class="dialog-title">{{ editDialog.formData.id ? '编辑样品信息' : '新增样品信息' }}</div>
      <van-form @submit="validateAndSave" class="edit-form">
        <!-- 图片上传区域 -->
        <div class="image-upload-section">
          <div class="upload-area">
            <div v-if="editDialog.fileList.length === 0" class="upload-button-container">
              <van-uploader :max-count="1" :before-read="beforeRead" :after-read="afterRead" :show-upload="false">
                <div class="uploader-slot">
                  <van-icon name="photograph" size="28" color="#07c160" />
                  <span>上传图片</span>
                </div>
              </van-uploader>
            </div>
            <div v-else class="preview-container">
              <div class="image-content">
                <div class="image-preview" @click="previewImage">
                  <img :src="editDialog.fileList[0].url" class="preview-image" />
                  <div class="preview-mask">
                    <van-icon name="eye-o" size="24" color="#fff" />
                  </div>
                </div>
                <div class="image-actions">
                  <van-button size="small" type="danger" round icon="delete-o" @click="clearImage">清除图片</van-button>
                  <van-uploader :max-count="1" :before-read="beforeRead" :after-read="afterRead" :show-upload="false">
                    <van-button size="small" type="primary" round icon="photo-o">重新上传</van-button>
                  </van-uploader>
                </div>
              </div>
              <div v-if="editDialog.compressionInfo" class="compression-info">
                <van-icon name="info-o" color="#07c160" /> {{ editDialog.compressionInfo }}
              </div>
            </div>
            <div class="upload-tip">建议尺寸 300x300，大小不超过15MB</div>
          </div>
        </div>
        
        <!-- 表单字段 -->
        <van-cell-group inset class="form-group">
          <van-field
            v-model="editDialog.formData.model"
            name="model"
            label="型号"
            placeholder="请输入型号"
            left-icon="label"
            :rules="[{ required: true, message: '请输入型号' }]"
          />
          <van-field 
            v-model="editDialog.formData.alias" 
            name="alias" 
            label="别称" 
            placeholder="请输入别称"
            left-icon="label-o" 
          />
          <van-field 
            v-model="editDialog.formData.colorCode" 
            name="colorCode" 
            label="颜色" 
            placeholder="请输入颜色代码"
            left-icon="brush-o" 
          />
          <van-field
            name="customerId"
            label="客户企业"
            is-link
            readonly
            left-icon="shop-o"
            :model-value="selectedCustomerName"
            placeholder="请选择客户企业"
            @click="editDialog.showCustomerPicker = true"
            :rules="[{ required: true, message: '请选择客户企业' }]"
          />
          <van-field 
            v-model="editDialog.formData.stock" 
            name="stock" 
            label="库存" 
            type="digit" 
            placeholder="请输入库存数量"
            left-icon="certificate" 
          />
          <van-field 
            v-model="editDialog.formData.unitPrice" 
            name="unitPrice" 
            label="单价(元)" 
            type="digit" 
            placeholder="请输入单价"
            left-icon="gold-coin-o" 
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" icon="success">确认保存</van-button>
          <van-button v-if="editDialog.formData.id" round block type="primary" icon="orders-o" @click="createOrder">新增订单</van-button>
          <van-button v-if="editDialog.formData.id" round block type="danger" icon="delete" @click="showDeleteConfirm">删除样品</van-button>
        </div>
      </van-form>
    </van-popup>

    <!-- 客户企业选择器 -->
    <van-popup v-model:show="editDialog.showCustomerPicker" position="bottom" round>
      <div class="customer-picker">
        <div class="customer-picker-header">
          <div class="cancel-btn" @click="editDialog.showCustomerPicker = false">取消</div>
          <div class="title">选择客户企业</div>
          <div class="empty-space"></div>
        </div>
        <div class="customer-search">
          <van-search v-model="customerSearchText" placeholder="搜索客户企业" />
        </div>
        <div class="customer-list">
          <div 
            v-for="customer in filteredCustomers" 
            :key="customer.id"
            class="customer-item"
            @click="selectCustomer(customer)"
          >
            <van-icon name="shop-o" color="#07c160" size="16" />
            <span>{{ customer.companyName }}</span>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="deleteDialog.show"
      title="删除确认"
      show-cancel-button
      confirm-button-color="#ee0a24"
      @confirm="confirmDelete"
    >
      <div class="delete-warning">
        <p>确认删除以下样品？</p>
        <p class="delete-item">型号：{{ deleteDialog.data.model }}</p>
        <p class="delete-item">别称：{{ deleteDialog.data.alias || '无' }}</p>
        <p v-if="deleteDialog.data.orderCount > 0" class="delete-warning-text">
          <van-icon name="warning-o" /> 此操作将同时删除 {{ deleteDialog.data.orderCount }} 个关联订单！
        </p>
        <p class="delete-warning-text">
          <van-icon name="info-o" /> 此操作不可恢复，请谨慎操作！
        </p>
      </div>
    </van-dialog>
    
    <!-- 二次确认弹窗 -->
    <van-dialog
      v-model:show="deleteDialog.showSecondConfirm"
      title="危险操作确认"
      show-cancel-button
      confirm-button-text="确认删除"
      confirm-button-color="#ee0a24"
      cancel-button-text="取消"
      @confirm="executeDelete"
    >
      <div class="delete-warning">
        <p class="second-confirm-title">您确定要删除此样品及其关联的所有订单吗？</p>
        <p class="delete-item">型号：{{ deleteDialog.data.model }}</p>
        <p class="delete-item">别称：{{ deleteDialog.data.alias || '无' }}</p>
        <p class="delete-item danger">关联订单数：{{ deleteDialog.data.orderCount }}</p>
        <p class="delete-warning-text">
          <van-icon name="warning-o" /> 此操作将删除所有关联订单，且不可恢复！
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showImagePreview } from 'vant';
import request from '@/core/utils/request.js';
import { getImageUrl } from '@/config/env.js';
import pinyin from 'pinyin';
import { compressImage, validateImageFile, blobToFile } from '@/core/tools/ImageCompressor.js';
import adminRoutes from '@/mp/router/main/adminRoutes';

// --- 默认常量 ---

// 默认图片（灰色背景的图片占位符）
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMmYyZjIiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzk5OTk5OSI+5peg5Zu+54mHPC90ZXh0Pgo8L3N2Zz4=';

// --- 响应式状态定义 ---

// 路由与导航
const route = useRoute();
const router = useRouter();

// 页面顶部通知状态
const notification = reactive({
  message: '',
  active: false,
});

// 浮动按钮拖拽状态
const draggable = reactive({
  position: { top: window.innerHeight * 0.75, left: window.innerWidth - 80 },
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
});

// 列表及分页状态
const listState = reactive({
  allItems: [],      // 从服务器获取的所有样品数据
  displayItems: [],  // 当前列表显示的数据
  customerOptions: [],// 客户企业选项
  loading: false,     // 是否处于加载状态（用于vant-list）
  refreshing: false,  // 是否处于下拉刷新状态
  finished: false,    // 是否已加载所有数据
  pageSize: 10,       // 每页大小
  currentPage: 1,     // 当前页码
});

// 搜索功能状态
const searchState = reactive({
  showPanel: false,   // 是否显示搜索面板
  model: '',          // 型号搜索关键词
  alias: '',          // 别称搜索关键词
  companyName: '',    // 客户企业搜索关键词
});

// 编辑/新增弹窗状态
const editDialog = reactive({
  show: false,                      // 是否显示弹窗
  formData: getDefaultFormData(),   // 表单数据
  fileList: [],                     // 上传的文件列表
  showCustomerPicker: false,        // 是否显示客户选择器
  uploadFile: null,                 // 待上传的文件对象
  compressionInfo: '',              // 图片压缩信息
});

// 删除确认弹窗状态
const deleteDialog = reactive({
  show: false,                      // 是否显示一级删除确认
  showSecondConfirm: false,         // 是否显示二级删除确认
  data: {                           // 待删除样品的相关信息
    id: null,
    model: '',
    alias: '',
    orderCount: 0,
  },
});

// 客户企业搜索文本
const customerSearchText = ref('');

// --- 计算属性 ---

// 动态页面标题
const pageTitle = computed(() => {
  // 优先显示通知消息
  if (notification.message) {
    return notification.message;
  }
  // 否则根据路由元信息显示标题
  const adminRoute = adminRoutes[0];
  const currentRouteName = route.name;
  if (adminRoute?.children) {
    const childRoute = adminRoute.children.find(child => child.name === currentRouteName);
    if (childRoute?.meta?.title) return childRoute.meta.title;
  }
  return route.meta.title || '样板管理';
});

// 过滤后的客户列表（用于搜索）
const filteredCustomers = computed(() => {
  if (!customerSearchText.value) {
    return listState.customerOptions;
  }
  return listState.customerOptions.filter(customer => 
    matchesSearch(customer.companyName, customerSearchText.value)
  );
});

// 根据当前搜索条件过滤后的样品列表
const filteredItems = computed(() => {
  let filtered = listState.allItems;
  if (searchState.model) {
    filtered = filtered.filter(item => matchesSearch(item.model, searchState.model));
  }
  if (searchState.alias) {
    filtered = filtered.filter(item => matchesSearch(item.alias, searchState.alias));
  }
  if (searchState.companyName) {
    filtered = filtered.filter(item => matchesSearch(item.companyName, searchState.companyName));
  }
  return filtered;
});

// 当前选中的客户企业名称
const selectedCustomerName = computed(() => {
  const customer = listState.customerOptions.find(c => c.id === editDialog.formData.customerId);
  return customer ? customer.companyName : '';
});


// --- 工具函数 ---

/**
 * @description 获取默认的表单数据结构
 */
function getDefaultFormData() {
  return {
    id: null,
    customerId: 2, // 默认为 "无"
    alias: '',
    model: '',
    colorCode: '',
    stock: 0,
    unitPrice: 0,
    image: null,
  };
}

/**
 * @description 获取文本的拼音
 * @param {string} text - 输入文本
 * @returns {string} 拼音字符串
 */
const getPinyin = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');
};

/**
 * @description 获取文本的拼音首字母
 * @param {string} text - 输入文本
 * @returns {string} 拼音首字母字符串
 */
const getPinyinInitials = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');
};

/**
 * @description 检查文本是否匹配搜索词（支持模糊、拼音、首字母）
 * @param {string} text - 待检查的文本
 * @param {string} searchTerm - 搜索词
 * @returns {boolean} 是否匹配
 */
const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  return textLower.includes(searchLower) || 
         getPinyin(text).toLowerCase().includes(searchLower) || 
         getPinyinInitials(text).toLowerCase().includes(searchLower);
};

// --- 方法 ---

/**
 * @description 返回上一页
 */
const goBack = () => router.back();

/**
 * @description 在页面顶部显示临时通知
 * @param {string} message - 通知内容
 * @param {number} duration - 显示时长（毫秒）
 */
const showTitleNotification = (message, duration = 2000) => {
  notification.message = message;
  notification.active = true;
  setTimeout(() => {
    notification.message = '';
    notification.active = false;
  }, duration);
};

// --- 浮动按钮拖拽 ---

const startDrag = (event) => {
  draggable.isDragging = true;
  const touch = event.touches[0];
  draggable.dragOffset = {
    x: touch.clientX - draggable.position.left,
    y: touch.clientY - draggable.position.top,
  };
};

const onDrag = (event) => {
  if (!draggable.isDragging) return;
  event.preventDefault(); // 防止页面滚动
  
  const touch = event.touches[0];
  const btnSize = 56; // 按钮尺寸
  const padding = 10; // 边缘安全距离
  
  const left = Math.min(
    Math.max(touch.clientX - draggable.dragOffset.x, padding),
    window.innerWidth - btnSize - padding
  );
  
  const top = Math.min(
    Math.max(touch.clientY - draggable.dragOffset.y, padding),
    window.innerHeight - btnSize - padding
  );
  
  draggable.position = { left, top };
};

const endDrag = () => {
  draggable.isDragging = false;
};


// --- 搜索相关 ---

/**
 * @description 切换搜索面板显示/隐藏
 */
const toggleSearchPanel = () => {
  searchState.showPanel = !searchState.showPanel;
};

/**
 * @description 搜索输入框回车事件，关闭软键盘并执行搜索
 */
const onSearchSubmit = (event) => {
  event.target.blur();
  handleSearch();
};

/**
 * @description 执行搜索，重置列表并加载过滤后的数据
 */
const handleSearch = () => {
  listState.currentPage = 1;
  loadFilteredItems();
  searchState.showPanel = false; // 执行搜索后自动关闭面板
};

/**
 * @description 重置搜索条件
 */
const resetSearch = () => {
  searchState.model = '';
  searchState.alias = '';
  searchState.companyName = '';
  listState.currentPage = 1;
  loadFilteredItems();
};


// --- 列表加载 ---

/**
 * @description 加载过滤和分页后的数据到显示列表
 */
const loadFilteredItems = () => {
  listState.finished = false;
  listState.displayItems = [];
  listState.loading = true; // 立即将loading设为true以显示加载中
  onLoad();
};

/**
 * @description Vant List 的 load 事件，用于加载更多数据
 */
const onLoad = () => {
  // 使用 setTimeout 模拟网络延迟，改善用户体验
  setTimeout(() => {
    const start = (listState.currentPage - 1) * listState.pageSize;
    const end = start + listState.pageSize;
    
    // 从已过滤的完整列表中截取当前页数据
    const newItems = filteredItems.value.slice(start, end);
    listState.displayItems.push(...newItems);
    
    listState.currentPage++;
    listState.loading = false;
    
    // 判断是否已加载完所有数据
    if (listState.displayItems.length >= filteredItems.value.length) {
      listState.finished = true;
    }
  }, 500);
};

/**
 * @description 下拉刷新处理
 * @param {boolean} fromOperation - 标记刷新是否由增删改操作触发
 */
const onRefresh = (fromOperation = false) => {
  listState.currentPage = 1;
  listState.finished = false;
  listState.displayItems = [];
  
  loadAllItems(fromOperation).then((response) => {
    listState.refreshing = false;
    loadFilteredItems();
    
    // 仅在用户手动下拉刷新时显示 "刷新成功"
    if (!response.fromOperation) {
      showTitleNotification('刷新成功');
    }
  });
};


// --- 数据请求 ---

/**
 * @description 加载所有客户企业选项
 */
const loadCustomerOptions = async () => {
  try {
    const response = await request.get('/customers');
    if (response.success && response.data) {
      listState.customerOptions = response.data;
    } else {
      listState.customerOptions = [{ id: 2, companyName: "无" }];
    }
  } catch (error) {
    showToast('加载企业列表失败');
    listState.customerOptions = [{ id: 2, companyName: "无" }];
  }
};

/**
 * @description 从后端加载所有样品数据
 * @param {boolean} fromOperation - 标记加载是否由增删改操作触发
 */
const loadAllItems = async (fromOperation = false) => {
  try {
    listState.loading = true;
    const response = await request.get('/samples');
    listState.allItems = response.data || [];
    
    // [特殊逻辑] 检查并尝试自动修复脏数据
    if (listState.allItems.some(item => item.customerId === null)) {
      try {
        const fixResponse = await request.post('/samples/fix-null-customers');
        const fixedCount = fixResponse.data || 0;
        if (fixedCount > 0) {
          showTitleNotification(`自动修复了 ${fixedCount} 个样品的企业关联`);
          // 修复后重新加载数据
          const reloadResponse = await request.get('/samples');
          listState.allItems = reloadResponse.data || [];
        }
      } catch (fixError) {
        // 修复失败，静默处理
      }
    }
    
    return { ...response, fromOperation };
  } catch (error) {
    showToast(error.response?.data?.message || '加载样品列表失败');
    return { success: false, fromOperation };
  } finally {
    listState.loading = false;
  }
};


// --- 表单与弹窗操作 ---

/**
 * @description 打开新增样品弹窗
 */
const addItem = () => {
  editDialog.formData = getDefaultFormData();
  editDialog.fileList = [];
  editDialog.uploadFile = null;
  editDialog.compressionInfo = '';
  editDialog.show = true;
};

/**
 * @description 打开编辑样品弹窗
 */
const editItem = async (item) => {
  try {
    const response = await request.get(`/samples/${item.id}`);
    const data = response.data;
    
    // 如果没有customerId，设置默认值
    if (!data.customerId) {
      data.customerId = 2;
    }
    
    editDialog.formData = data;
    editDialog.fileList = data.image ? [{ url: getImageUrl(data.image) }] : [];
    editDialog.uploadFile = null;
    editDialog.compressionInfo = '';
    editDialog.show = true;
  } catch (error) {
    showToast('获取样品详情失败');
  }
};

/**
 * @description 选择客户企业
 */
const selectCustomer = (customer) => {
  if (customer?.id) {
    editDialog.formData.customerId = customer.id;
  }
  editDialog.showCustomerPicker = false;
  showTitleNotification(`已选择客户: ${customer.companyName}`);
};


// --- 图片处理 ---

/**
 * @description Vant Uploader 文件读取前的校验
 */
const beforeRead = (file) => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    showToast(validation.message);
    return false;
  }
  return true;
};

/**
 * @description Vant Uploader 文件读取后，进行压缩处理
 */
const afterRead = async (file) => {
  try {
    const originalFile = file.file;
    const originalSize = originalFile.size;
    const sizeThreshold = 250 * 1024; // 250KB

    if (originalSize > sizeThreshold) {
      // 图片大于阈值，执行压缩
      const response = await compressImage(originalFile);
      editDialog.uploadFile = blobToFile(response.blob, originalFile.name);
      editDialog.fileList = [{ url: URL.createObjectURL(response.blob) }];
      
      const compressedSize = response.blob.size;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      editDialog.compressionInfo = `已压缩: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (省${reduction}%)`;
      showTitleNotification(response.message);
    } else {
      // 图片无需压缩
      editDialog.uploadFile = originalFile;
      editDialog.fileList = [{ url: URL.createObjectURL(originalFile) }];
      editDialog.compressionInfo = `大小: ${(originalSize/1024).toFixed(1)}KB (无需压缩)`;
    }
  } catch (error) {
    showToast(error?.message || '图片处理失败，请重试');
    editDialog.compressionInfo = '';
  }
};

/**
 * @description 清除已选择或上传的图片
 */
const clearImage = () => {
  editDialog.fileList = [];
  editDialog.uploadFile = null;
  editDialog.formData.image = null; // 确保表单中的image字段也清空
  editDialog.compressionInfo = '';
};

/**
 * @description 预览图片
 */
const previewImage = () => {
  if (editDialog.fileList.length > 0) {
    showImagePreview({
      images: [editDialog.fileList[0].url],
      closeable: true,
      showIndex: false
    });
  }
};


// --- 保存与删除 ---

/**
 * @description 表单校验通过后，提交数据到后端
 */
const validateAndSave = async () => {
  try {
    const form = new FormData();
    const isEditing = !!editDialog.formData.id;

    // 1. 准备样品核心数据
    const sampleData = {
      customerId: editDialog.formData.customerId || 2,
      alias: editDialog.formData.alias,
      model: editDialog.formData.model,
      colorCode: editDialog.formData.colorCode || '',
      stock: editDialog.formData.stock || 0,
      unitPrice: editDialog.formData.unitPrice || 0,
      image: isEditing ? editDialog.formData.image : null, // 编辑时保留原图片路径
    };
    form.append('sample', JSON.stringify(sampleData));

    // 2. 处理图片文件
    if (editDialog.uploadFile) {
      // 如果有新上传的文件，则附加
      form.append('image', editDialog.uploadFile, editDialog.uploadFile.name || 'image.jpg');
    } else if (isEditing && editDialog.fileList.length === 0) {
      // 如果是编辑模式且清空了图片
      form.append('image', new Blob([], { type: 'application/octet-stream' }), 'empty.bin');
    }

    // 3. 发送请求
    const endpoint = isEditing ? `/samples/${editDialog.formData.id}` : '/samples';
    const method = isEditing ? request.put : request.post;
    
    const response = await method(endpoint, form, { headers: { 'Content-Type': undefined } });
    
    showTitleNotification(response.message);
    editDialog.show = false;
    onRefresh(true); // 刷新列表
  } catch (error) {
    showToast(error.response?.data?.message || '保存失败，请检查数据');
  }
};

/**
 * @description 显示删除确认弹窗，并检查关联订单数
 */
const showDeleteConfirm = async () => {
  try {
    // 先从后端获取关联订单数量
    const response = await request.get(`/samples/${editDialog.formData.id}/orders/count`);
    const orderCount = response.data || 0;

    deleteDialog.data = {
      id: editDialog.formData.id,
      model: editDialog.formData.model,
      alias: editDialog.formData.alias,
      orderCount: orderCount,
    };

    deleteDialog.show = true;
  } catch (error) {
    showToast('检查样品关联订单失败');
  }
};

/**
 * @description 一级删除确认，如果有关联订单则弹出二级确认
 */
const confirmDelete = () => {
  // 如果有关联订单，需要二次确认
  if (deleteDialog.data.orderCount > 0) {
    deleteDialog.showSecondConfirm = true;
  } else {
    // 无关联订单，直接执行删除
    executeDelete();
  }
};

/**
 * @description 执行最终的删除操作
 */
const executeDelete = async () => {
  try {
    const response = await request.delete(`/samples/${deleteDialog.data.id}`);
    showTitleNotification(response.message);
    
    // 关闭所有相关弹窗
    editDialog.show = false;
    deleteDialog.show = false;
    deleteDialog.showSecondConfirm = false;
    
    onRefresh(true); // 刷新列表
  } catch (error) {
    showToast(error?.response?.data?.message || '删除失败');
  }
};


// --- 其他操作 ---

/**
 * @description 跳转到订单页面为当前样品创建新订单
 */
const createOrder = () => {
  if (editDialog.formData.id) {
    router.push({
      name: 'AdminOrderManagement',
      query: { sampleId: editDialog.formData.id },
    });
  }
};

// --- 组件生命周期 ---

onMounted(() => {
  // 初始化时加载必要数据
  loadCustomerOptions();
  loadAllItems().then(() => {
    loadFilteredItems(); // 初始加载列表项
  });
});

</script>

<style scoped>
.sample-management {
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
}

.header-back {
  position: absolute;
  left: 16px;
  color: #fff;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  transition: all 0.3s ease;
}

/* 通知消息激活样式 */
.header-title.notification-active {
  color: #ffeb3b; /* 醒目的黄色 */
  font-weight: bold;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.header-actions {
  position: absolute;
  right: 16px;
  color: #fff;
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
  transition: all 0.3s ease-in-out;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 样品列表 */
.sample-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  transition: margin-top 0.3s ease;
}

.list-with-search {
  margin-top: 245px; /* 根据搜索面板实际高度微调 */
}

.sample-list:deep(.van-pull-refresh__head) {
  color: #07c160;
}

.sample-item {
  display: flex;
  background-color: #fff;
  margin-bottom: 12px;
  padding: 16px;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.sample-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.sample-image {
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

.sample-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.sample-model, .sample-alias, .sample-company {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sample-model {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.sample-alias {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.sample-company {
  font-size: 12px;
  color: #969799;
}

.sample-details {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.sample-stock, .sample-price {
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 浮动添加按钮 */
.floating-add-btn {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.4);
  z-index: 99;
  transition: all 0.2s ease;
}

.floating-add-btn:active {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
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

/* 图片上传区域 */
.image-upload-section {
  padding: 16px;
  margin-bottom: 24px;
  background-color: #f8f8f8;
  border-radius: 12px;
}

.upload-area {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.uploader-slot {
  width: 140px;
  height: 140px;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #07c160;
  border: 2px dashed #d8d8d8;
  border-radius: 8px;
  gap: 8px;
  transition: all 0.3s ease;
}

.uploader-slot:active {
  background-color: #e8f7ef;
  border-color: #07c160;
}

.preview-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.image-preview {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebedf0;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .preview-mask {
  opacity: 1;
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compression-info {
  font-size: 13px;
  color: #07c160;
  margin-top: 10px;
  text-align: center;
  padding: 8px 16px;
  background-color: #e8f7ef;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #969799;
  margin-top: 12px;
}

/* 删除确认弹窗 */
.delete-warning {
  padding: 20px;
}

.delete-item {
  margin: 10px 0;
  font-size: 15px;
}

.delete-warning-text {
  margin-top: 16px;
  color: #ee0a24;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.second-confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
  margin-bottom: 16px;
}

.delete-item.danger {
  color: #ee0a24;
  font-weight: 500;
}

/* 客户企业选择器 */
.customer-picker {
  width: 100%;
  height: 60vh;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.customer-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.cancel-btn {
  color: #969799;
  font-size: 15px;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #323233;
}

.empty-space {
  width: 40px;
}

.customer-search {
  padding: 8px 12px;
  border-bottom: 1px solid #f5f5f5;
}

.customer-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.customer-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-item:last-child {
  border-bottom: none;
}

.customer-item:active {
  background-color: #f7f8fa;
}
</style> 