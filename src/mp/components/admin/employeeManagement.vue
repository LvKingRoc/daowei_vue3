<template>
  <div class="employee-management">
    <!-- 自定义标题栏 -->
    <div class="custom-header">
      <div class="header-back" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div class="header-title" :class="{ 'notification-active': isNotifying }">{{ pageTitle }}</div>
      <div class="header-actions">
        <van-icon name="search" size="20" @click="toggleSearchPanel" />
      </div>
    </div>
    <!-- 搜索面板 -->
    <transition name="slide-fade">
      <div class="search-panel" v-show="showSearchPanel">
        <div class="search-filters">
          <van-field
            v-model="searchName"
            placeholder="请输入姓名"
            clearable
            class="search-field"
            left-icon="user-o"
            @keyup.enter="handleSearch"
          />
          <div class="search-buttons">
            <van-button type="primary" size="small" round icon="search" @click="handleSearch">搜索</van-button>
            <van-button plain size="small" round icon="replay" @click="resetSearch">重置</van-button>
          </div>
        </div>
      </div>
    </transition>
    <!-- 员工列表 -->
    <div class="employee-list">
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
            class="employee-item"
            @click="handleEditItem(item)"
          >
            <div class="employee-avatar">
              <van-icon name="user-o" size="32" color="#07c160" />
            </div>
            <div class="employee-info">
              <div class="employee-name">{{ item.name }}</div>
              <div class="employee-meta">
                <span>{{ item.gender === 'male' ? '男' : item.gender === 'female' ? '女' : '无' }}</span>
                <span v-if="item.idCard">/ 年龄: {{ getAgeFromIdCard(item.idCard) }}</span>
              </div>
              <div class="employee-contact">
                <van-icon name="phone-o" size="14" />
                <span>{{ item.phone || '无' }}</span>
              </div>
              <div class="employee-contact">
                <van-icon name="envelop-o" size="14" />
                <span>{{ item.email || '无' }}</span>
              </div>
              <div class="employee-contact">
                <van-icon name="idcard" size="14" />
                <span>{{ item.idCard ? maskIdCard(item.idCard) : '无' }}</span>
              </div>
              <div class="employee-contact">
                <van-icon name="clock-o" size="14" />
                <span>入职: {{ item.hireDate || '无' }}</span>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
    <!-- 浮动添加按钮 -->
    <div class="floating-add-btn"
      @click="handleAddItem"
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
      :style="{ height: '85%' }"
    >
      <div class="dialog-title">{{ formData.id ? '编辑员工信息' : '新增员工' }}</div>
      <van-form class="edit-form" ref="employeeForm">
        <van-cell-group inset class="form-group">
          <van-field
            v-model="formData.name"
            name="name"
            label="姓名"
            placeholder="请输入姓名"
            left-icon="user-o"
            :rules="[{ required: true, message: '请输入姓名' }]"
          />
          <van-field
            v-model="formData.gender"
            name="gender"
            label="性别"
            placeholder="请选择性别"
            left-icon="friends-o"
            is-link
            readonly
            @click="showGenderPicker = true"
            :rules="[{ required: true, message: '请选择性别' }]"
            :model-value="formData.gender ? (formData.gender === 'male' ? '男' : '女') : ''"
          />
          <van-popup v-model:show="showGenderPicker" position="bottom">
            <van-picker
              :columns="genderOptions"
              @confirm="onGenderConfirm"
              @cancel="showGenderPicker = false"
            />
          </van-popup>
          <van-field
            v-model="formData.phone"
            name="phone"
            label="电话"
            placeholder="请输入联系电话"
            left-icon="phone-o"
            :rules="phoneRules"
          />
          <van-field
            v-model="formData.email"
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            left-icon="envelop-o"
            :rules="emailRules"
          />
          <van-field
            v-model="formData.idCard"
            name="idCard"
            label="身份证"
            placeholder="请输入身份证号"
            left-icon="idcard"
            :rules="idCardRules"
          />
          <van-field
            v-model="formData.hireDate"
            name="hireDate"
            label="入职日期"
            placeholder="选择日期"
            left-icon="clock-o"
            is-link
            readonly
            @click="openDatePicker"
          />
          <van-popup v-model:show="showDatePicker" position="bottom" round>
            <van-date-picker
              v-model="tempHireDateArray"
              title="选择入职日期"
              @confirm="onDateConfirm"
              @cancel="showDatePicker = false"
            />
          </van-popup>
        </van-cell-group>
        <div class="form-actions">
          <van-button round block type="primary" native-type="button" @click="handleSubmit" icon="success">确认保存</van-button>
          <van-button v-if="formData.id" round block type="danger" icon="delete" @click="handleDeleteItem">删除员工</van-button>
        </div>
      </van-form>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '@/core/utils/request.js';
import pinyin from 'pinyin';
import adminRoutes from '@/mp/router/main/adminRoutes';

// 路由和页面标题
const route = useRoute();
const router = useRouter();
const goBack = () => router.back();
const notificationMessage = ref('');
const isNotifying = ref(false);

const pageTitle = computed(() => {
  if (notificationMessage.value) return notificationMessage.value;
  const adminRoute = adminRoutes[0];
  const currentRouteName = route.name;
  if (adminRoute?.children) {
    const childRoute = adminRoute.children.find(child => child.name === currentRouteName);
    if (childRoute?.meta?.title) return childRoute.meta.title;
  }
  return route.meta.title || '员工管理';
});

// 通知
const showTitleNotification = (message, duration = 2000) => {
  notificationMessage.value = message;
  isNotifying.value = true;
  setTimeout(() => {
    notificationMessage.value = '';
    isNotifying.value = false;
  }, duration);
};

// 浮动按钮拖拽
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
  const left = Math.min(Math.max(touch.clientX - dragOffset.value.x, padding), window.innerWidth - btnSize - padding);
  const top = Math.min(Math.max(touch.clientY - dragOffset.value.y, padding), window.innerHeight - btnSize - padding);
  btnPosition.value = { left, top };
};
const endDrag = () => isDragging.value = false;

// 搜索
const showSearchPanel = ref(false);
const searchName = ref('');
const toggleSearchPanel = () => showSearchPanel.value = !showSearchPanel.value;
const onSearchSubmit = (event) => {
  if (event.key === 'Enter') {
    event.target.blur();
    handleSearch();
  }
};
const handleSearch = () => {
  currentPage.value = 1;
  loadFilteredItems();
  showSearchPanel.value = false;
};
const resetSearch = () => {
  searchName.value = '';
  currentPage.value = 1;
  loadFilteredItems();
};
const getPinyin = (text) => !text ? '' : pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');
const getPinyinInitials = (text) => !text ? '' : pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');
const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  const searchLower = searchTerm.toLowerCase();
  return text.toLowerCase().includes(searchLower) ||
    getPinyin(text).toLowerCase().includes(searchLower) ||
    getPinyinInitials(text).toLowerCase().includes(searchLower);
};

// 列表与分页
const items = ref([]);
const displayItems = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const pageSize = ref(10);
const currentPage = ref(1);
const filteredItems = computed(() => {
  let filtered = items.value;
  if (searchName.value) filtered = filtered.filter(item => matchesSearch(item.name, searchName.value));
  return filtered;
});
const onLoad = () => {
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const filteredArray = Array.isArray(filteredItems.value) ? filteredItems.value : [];
    if (start >= filteredArray.length) {
      finished.value = true;
      loading.value = false;
      return;
    }
    displayItems.value = [...displayItems.value, ...filteredArray.slice(start, start + pageSize.value)];
    currentPage.value++;
    loading.value = false;
    finished.value = displayItems.value.length >= filteredArray.length;
  }, 500);
};
const loadFilteredItems = () => {
  finished.value = false;
  displayItems.value = [];
  loading.value = true;
  onLoad();
};
const onRefresh = (fromOperation = false) => {
  currentPage.value = 1;
  finished.value = false;
  displayItems.value = [];
  loadItems().then(() => {
    refreshing.value = false;
    loadFilteredItems();
    // 只有在手动下拉刷新时才显示刷新成功
    if (!fromOperation) {
      showTitleNotification('刷新成功');
    }
  });
};
const loadItems = async () => {
  try {
    loading.value = true;
    const response = await request.get('/employees');
    items.value = response.data || [];
  } catch (error) {
    showToast('加载员工列表失败');
    items.value = [];
  } finally {
    loading.value = false;
  }
};

// 编辑相关
const showDialog = ref(false);
const formData = ref(getDefaultFormData());
function getDefaultFormData() {
  return {
    id: null,
    name: '',
    gender: '',
    phone: '',
    email: '',
    idCard: '',
    hireDate: ''
  };
}
const showGenderPicker = ref(false);
const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' }
];
const onGenderConfirm = ({ selectedOptions }) => {
  formData.value.gender = selectedOptions[0].value;
  showGenderPicker.value = false;
};

// 日期选择器相关
const showDatePicker = ref(false);
const tempHireDateArray = ref([]);

// 打开日期选择器
const openDatePicker = () => {
  if (formData.value.hireDate) {
    tempHireDateArray.value = formData.value.hireDate.split('-');
  } else {
    const today = new Date();
    tempHireDateArray.value = [
      String(today.getFullYear()),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ];
  }
  showDatePicker.value = true;
};

// 日期确认回调
const onDateConfirm = ({ selectedValues }) => {
  formData.value.hireDate = selectedValues.join('-');
  showDatePicker.value = false;
};

const handleAddItem = () => {
  formData.value = getDefaultFormData();
  showDialog.value = true;
};
const handleEditItem = async (item) => {
  try {
    const response = await request.get(`/employees/${item.id}`);
    formData.value = response.data;
    showDialog.value = true;
  } catch (error) {
    showToast('获取员工详情失败');
  }
};

// 删除相关
const handleDeleteItem = () => {
  const { name, gender, phone, hireDate, id } = formData.value;
  showConfirmDialog({
    title: '删除确认',
    message: `
      <div class="delete-warning">
        <p>确认删除以下员工？</p>
        <p class="delete-item">姓名：${name}</p>
        <p class="delete-item">性别：${gender === 'male' ? '男' : '女'}</p>
        <p class="delete-item">电话：${phone || '无'}</p>
        <p class="delete-item">入职日期：${hireDate || '无'}</p>
        <p class="delete-warning-text">
          <i class="van-icon van-icon-info-o"></i> 此操作不可恢复！
        </p>
      </div>
    `,
    allowHtml: true,
    confirmButtonColor: '#ee0a24',
  }).then(async () => {
    try {
      const response = await request.delete(`/employees/${id}`);
      showTitleNotification(response.message);
      showDialog.value = false;
      onRefresh(true);
    } catch (error) {
      showToast(error?.response?.data?.message || '删除失败');
    }
  }).catch(() => {
    // 用户点击取消，无需操作
  });
};

// 使用计算属性动态生成规则数组
const phoneRules = computed(() => {
  if (!formData.value.phone) return [];
  return [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号码' }];
});

const emailRules = computed(() => {
  if (!formData.value.email) return [];
  return [{ pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱格式' }];
});

const idCardRules = computed(() => {
  if (!formData.value.idCard) return [];
  return [{ pattern: /^\d{17}[\dXx]$/, message: '请输入正确的18位身份证号' }];
});

// 表单保存
const employeeForm = ref();
const handleSubmit = async () => {
  try {
    await employeeForm.value.validate();
    let response;
    if (formData.value.id) {
      response = await request.put(`/employees/${formData.value.id}`, formData.value);
    } else {
      response = await request.post('/employees', formData.value);
    }
    showTitleNotification(response.message);
    showDialog.value = false;
    onRefresh(true);
  } catch (error) {
    // Vant 表单验证失败会自动提示，此处无需额外处理
    console.error('表单验证或提交失败:', error);
  }
};

// 工具
const getAgeFromIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return '';
  const birthYear = parseInt(idCard.substring(6, 10), 10);
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

// 掩盖身份证号码，显示为XXXXXX XXXXXXXX XXXX
const maskIdCard = (idCard) => {
  if (!idCard) return '';
  const cleanedId = idCard.replace(/\s/g, '');
  if (cleanedId.length === 18) {
    return `${cleanedId.slice(0, 6)} ${cleanedId.slice(6, 14)} ${cleanedId.slice(14, 18)}`;
  }
  return idCard;
};

// 暴露
defineExpose({ toggleSearchPanel, handleAddItem, goBack });

onMounted(() => {
  loadItems().then(() => loadFilteredItems());
});
</script>

<style scoped>
.employee-management {
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

.employee-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  margin-top: 0;
  transition: margin-top 0.3s ease;
}

.employee-item {
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

.employee-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.employee-avatar {
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

.employee-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.employee-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-meta {
  font-size: 13px;
  color: #646566;
  margin-bottom: 2px;
}

.employee-contact {
  font-size: 13px;
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

.form-actions {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;
}

/* 弹窗内的删除确认样式 */
:deep(.delete-warning) {
  padding: 10px 0;
  text-align: left;
}
:deep(.delete-item) {
  margin: 8px 0;
  font-size: 15px;
  color: #646566;
}
:deep(.delete-warning-text) {
  margin-top: 16px;
  color: #ee0a24;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 日期选择器样式 */
:deep(.van-picker__toolbar) {
  font-weight: 500;
}
</style> 