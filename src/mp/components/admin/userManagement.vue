<template>
  <div class="user-management">
    <!-- 自定义标题栏 -->
    <div class="custom-header">
      <div class="header-back" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div class="header-title" :class="{ 'notification-active': notificationMessage }">{{ pageTitle }}</div>
      <div class="header-actions">
        <van-icon name="search" size="20" @click="toggleSearchPanel" />
      </div>
    </div>
    <!-- 搜索面板 -->
    <transition name="slide-fade">
      <div class="search-panel" v-show="showSearchPanel">
        <div class="search-filters">
          <van-field
            v-model="searchUsername"
            placeholder="请输入账号"
            clearable
            class="search-field"
            left-icon="user-o"
            @keyup="onSearchSubmit"
          />
          <van-field
            v-model="searchName"
            placeholder="请输入姓名"
            clearable
            class="search-field"
            left-icon="contact"
            @keyup="onSearchSubmit"
          />
          <div class="search-buttons">
            <van-button type="primary" size="small" round icon="search" @click="handleSearch">搜索</van-button>
            <van-button plain size="small" round icon="replay" @click="resetSearch">重置</van-button>
          </div>
        </div>
      </div>
    </transition>
    <!-- 用户列表 -->
    <div class="user-list" :class="{ 'list-with-search': showSearchPanel }">
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
            class="user-item"
            @click="editItem(item)"
          >
            <div class="user-avatar">
              <van-icon name="user-o" size="32" color="#07c160" />
            </div>
            <div class="user-info">
              <div class="user-username">{{ item.name || item.username }}</div>
              <div class="user-meta">
                <span>账号：{{ item.username }}</span>
              </div>
              <div class="user-meta">
                <span>手机号：{{ item.phone || '无' }}</span>
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
      :style="{ top: btnPosition.top + 'px', left: btnPosition.left + 'px' }">
      <van-icon name="plus" size="24" color="#fff" />
    </div>
    <!-- 编辑弹窗 -->
    <van-popup
      v-model:show="showDialog"
      position="bottom"
      round
      closeable
      close-icon-position="top-right"
      :style="{ height: '70%' }"
    >
      <div class="dialog-title">{{ formData.id ? '编辑用户' : '新增用户' }}</div>
      <van-form @submit="onSave" class="edit-form">
        <van-cell-group inset class="form-group">
          <van-field
            v-model="formData.username"
            name="username"
            label="账号"
            placeholder="请输入账号"
            left-icon="user-o"
            :rules="[
              { required: true, message: '请输入账号' },
              { pattern: /^[a-zA-Z0-9]{3,20}$/, message: '账号为3-20位的字母和数字' }
            ]"
          />
          <van-field
            v-model="formData.password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            left-icon="lock"
            :type="formData.id ? 'text' : 'password'"
            :rules="[
              { required: true, message: '请输入密码' },
              { pattern: /^.{6,20}$/, message: '密码长度为6-20位' }
            ]"
          />
          <van-field
            v-model="formData.name"
            name="name"
            label="姓名"
            placeholder="请输入姓名"
            left-icon="smile-o"
            :rules="[{ required: true, message: '请输入姓名' }]"
          />
          <van-field
            v-model="formData.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            left-icon="phone-o"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]"
          />
        </van-cell-group>
        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" icon="success">确认保存</van-button>
          <van-button v-if="formData.id" round block type="danger" icon="delete" @click="showDeleteConfirm">删除用户</van-button>
        </div>
      </van-form>
    </van-popup>
    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      show-cancel-button
      confirm-button-color="#ee0a24"
      @confirm="executeDelete"
    >
      <div class="delete-warning">
        <p>确认删除以下用户？</p>
        <p class="delete-item">账号：{{ deleteItemData.username }}</p>
        <p class="delete-item">姓名：{{ deleteItemData.name }}</p>
        <p class="delete-item">手机号：{{ deleteItemData.phone }}</p>
        <p class="delete-warning-text">
          <van-icon name="info-o" /> 此操作不可恢复，请谨慎操作！
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '@/core/utils/request.js';
import pinyin from 'pinyin';
import adminRoutes from '@/mp/router/main/adminRoutes';

// ==================
// 组件核心状态
// ==================
const items = ref([]); // 存储从API获取的完整用户列表
const displayItems = ref([]); // 当前列表上显示的用户 (用于无限滚动)
const loading = ref(false); // 列表加载状态
const refreshing = ref(false); // 下拉刷新状态
const finished = ref(false); // 是否所有数据都已加载
const pageSize = ref(10); // 每页加载的项目数
const currentPage = ref(1); // 当前页码
const showDialog = ref(false); // 编辑/新增弹窗的显示状态
const formData = ref(getDefaultFormData()); // 表单数据
const showDeleteDialog = ref(false); // 删除确认弹窗的显示状态
const deleteItemData = ref({ id: null, username: '', name: '', phone: '' }); // 待删除用户的数据

// ==================
// 路由与导航
// ==================
const route = useRoute();
const router = useRouter();
const goBack = () => router.back();

// ==================
// 页面标题与通知
// ==================
const notificationMessage = ref('');
const pageTitle = computed(() => {
  // 优先显示临时通知
  if (notificationMessage.value) return notificationMessage.value;

  // 否则，尝试从路由元信息中获取标题
  const adminRoute = adminRoutes[0];
  const currentRouteName = route.name;
  if (adminRoute?.children) {
    const childRoute = adminRoute.children.find(child => child.name === currentRouteName);
    if (childRoute?.meta?.title) return childRoute.meta.title;
  }
  return route.meta.title || '用户管理'; // 默认标题
});

/**
 * 在标题栏显示临时通知。
 * @param {string} message - 要显示的消息。
 * @param {number} duration - 显示时长 (毫秒)。
 */
const showTitleNotification = (message, duration = 2000) => {
  notificationMessage.value = message;
  setTimeout(() => {
    notificationMessage.value = '';
  }, duration);
};

// ==================
// 浮动添加按钮拖拽逻辑
// ==================
const btnPosition = ref({ top: window.innerHeight * 0.75, left: window.innerWidth - 80 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const startDrag = (event) => {
  isDragging.value = true;
  const touch = event.touches[0];
  dragOffset.value = {
    x: touch.clientX - btnPosition.value.left,
    y: touch.clientY - btnPosition.value.top
  };
};

const onDrag = (event) => {
  if (!isDragging.value) return;
  event.preventDefault();
  const touch = event.touches[0];
  const btnSize = 56, padding = 10;
  // 限制按钮在屏幕内拖动
  const left = Math.min(Math.max(touch.clientX - dragOffset.value.x, padding), window.innerWidth - btnSize - padding);
  const top = Math.min(Math.max(touch.clientY - dragOffset.value.y, padding), window.innerHeight - btnSize - padding);
  btnPosition.value = { left, top };
};

const endDrag = () => {
  isDragging.value = false;
};

// ==================
// 搜索功能
// ==================
const showSearchPanel = ref(false);
const searchUsername = ref('');
const searchName = ref('');

const toggleSearchPanel = () => {
  showSearchPanel.value = !showSearchPanel.value;
};

// 监听键盘回车事件进行搜索
const onSearchSubmit = (event) => {
  if (event.key === 'Enter') {
    event.target.blur();
    handleSearch();
  }
};

// 执行搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadFilteredItems();
  showSearchPanel.value = false;
};

// 重置搜索条件
const resetSearch = () => {
  searchUsername.value = '';
  searchName.value = '';
  currentPage.value = 1;
  loadFilteredItems();
};

/**
 * 汉字转拼音。
 * @param {string} text - 输入的文本。
 * @returns {string} 转换后的全拼。
 */
const getPinyin = (text) => !text ? '' : pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');

/**
 * 汉字转拼音首字母。
 * @param {string} text - 输入的文本。
 * @returns {string} 转换后的拼音首字母。
 */
const getPinyinInitials = (text) => !text ? '' : pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');

/**
 * 检查文本是否匹配搜索词 (支持中文、拼音和首字母)。
 * @param {string} text - 待检查的文本。
 * @param {string} searchTerm - 搜索词。
 * @returns {boolean} 是否匹配。
 */
const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  const searchLower = searchTerm.toLowerCase();
  return text.toLowerCase().includes(searchLower) ||
    getPinyin(text).toLowerCase().includes(searchLower) ||
    getPinyinInitials(text).toLowerCase().includes(searchLower);
};

// ==================
// 数据加载与列表处理
// ==================

// 根据当前搜索条件计算出最终要展示的列表
const filteredItems = computed(() => {
  let filtered = items.value;
  if (searchUsername.value) {
    filtered = filtered.filter(item => matchesSearch(item.username, searchUsername.value));
  }
  if (searchName.value) {
    filtered = filtered.filter(item => matchesSearch(item.name, searchName.value));
  }
  return filtered;
});

// `van-list` 的 load 事件处理器，用于无限滚动加载
const onLoad = () => {
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    if (start >= filteredItems.value.length) {
      finished.value = true; // 所有数据已加载完毕
      loading.value = false;
      return;
    }
    // 追加新数据到显示列表
    displayItems.value.push(...filteredItems.value.slice(start, start + pageSize.value));
    currentPage.value++;
    loading.value = false;
    finished.value = displayItems.value.length >= filteredItems.value.length;
  }, 500); // 模拟网络延迟
};

// 加载经过筛选和分页的条目，通常在搜索或重置后调用
const loadFilteredItems = () => {
  finished.value = false;
  displayItems.value = [];
  loading.value = true;
  onLoad();
};

/**
 * 下拉刷新列表数据。
 * @param {boolean} fromOperation - 是否由内部操作(如增删改)触发，用于决定是否显示 "刷新成功" 提示。
 */
const onRefresh = (fromOperation = false) => {
  currentPage.value = 1;
  finished.value = false;
  displayItems.value = [];
  loadItems().then(() => {
    refreshing.value = false;
    loadFilteredItems();
    if (!fromOperation) {
      showTitleNotification('刷新成功');
    }
  });
};

// 从API加载所有用户数据
const loadItems = async () => {
  try {
    loading.value = true;
    const response = await request.get('/user/findAll');
    items.value = response.data || [];
  } catch (error) {
    showToast('加载用户列表失败');
    items.value = [];
  } finally {
    loading.value = false;
  }
};

// ==================
// CRUD (增删改查) 操作
// ==================

// 获取一个干净的、用于表单的默认对象
function getDefaultFormData() {
  return {
    id: null,
    username: '',
    password: '',
    name: '',
    phone: ''
  };
}

// 点击 "新增" 按钮
const addItem = () => {
  formData.value = getDefaultFormData();
  showDialog.value = true;
};

// 点击列表中的某个用户项
const editItem = (item) => {
  // 填充表单数据
  formData.value = { ...item };
  showDialog.value = true;
};

// 点击 "删除" 按钮，显示确认对话框
const showDeleteConfirm = () => {
  deleteItemData.value = {
    id: formData.value.id,
    username: formData.value.username,
    name: formData.value.name,
    phone: formData.value.phone
  };
  showDeleteDialog.value = true;
};

// 确认执行删除操作
const executeDelete = async () => {
  try {
    const response = await request.delete(`/user/delete/${deleteItemData.value.id}`);
    showTitleNotification(response.message);
    showDialog.value = false;
    showDeleteDialog.value = false;
    onRefresh(true); // 操作成功后刷新列表
  } catch (error) {
    showToast(error?.response?.data?.message || '删除失败');
  }
};

/**
 * 表单提交处理。
 * Vant Form 会在所有字段验证通过后才触发 submit 事件，因此这里无需再进行手动验证。
 */
const onSave = async () => {
  try {
    const data = { ...formData.value };
    let response;

    if (formData.value.id) {
      // ID 存在，执行更新操作
      response = await request.put('/user/update', data);
    } else {
      // ID 不存在，执行新增操作
      response = await request.post('/user/add', data);
    }
    
    showTitleNotification(response.message);
    showDialog.value = false;
    onRefresh(true); // 操作成功后刷新列表
  } catch (error) {
    showToast(error?.response?.data?.message || '保存失败，请检查数据');
  }
};

// ==================
// 组件生命周期与暴露方法
// ==================
defineExpose({ toggleSearchPanel, addItem, goBack });

onMounted(() => {
  // 组件挂载后，加载初始数据
  loadItems().then(() => loadFilteredItems());
});
</script>

<style scoped>
.user-management {
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
  transition: color 0.3s ease;
}

.header-title.notification-active {
  color: #ffeb3b;
  font-weight: bold;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
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
  color: #fff;
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
  max-height: 200px;
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

.search-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 10px;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  margin-top: 0;
  transition: margin-top 0.3s ease;
}

.list-with-search {
  margin-top: 200px;
}

.user-item {
  display: flex;
  background-color: #fff;
  margin-bottom: 12px;
  padding: 16px;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  align-items: flex-start;
}

.user-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  margin-right: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f7ef;
  border-radius: 8px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-username {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  font-size: 13px;
  color: #646566;
  margin-bottom: 2px;
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
</style>
