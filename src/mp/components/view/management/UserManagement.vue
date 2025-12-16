<template>
  <div class="user-management">
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
      </div>
    </van-sticky>

    <!-- 列表区域 -->
    <van-pull-refresh v-model="refreshing" :disabled="!isAtTop" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="item in list" :key="item.id" class="user-item">
          <van-swipe-cell>
            <div class="user-card" @click="editUser(item)">
              <div class="user-info">
                <div class="user-username">{{ item.username }}</div>

                <div class="user-row">
                  <span class="user-label">姓名：</span>
                  <span class="user-value">{{ item.name }}</span>
                </div>
                <div class="user-row">
                  <span class="user-label">手机号：</span>
                  <span class="user-value">{{ item.phone || '无手机号' }}</span>
                </div>

                <div class="user-card-actions">
                  <van-button size="small" plain @click.stop="editUser(item)">编辑</van-button>
                  <van-button size="small" type="danger" plain @click.stop="deleteUser(item)">删除</van-button>
                </div>
              </div>
            </div>
            <template #right>
              <van-button square text="删除" type="danger" class="delete-button" @click="deleteUser(item)" />
            </template>
          </van-swipe-cell>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 悬浮按钮 - 新增 -->
    <div class="fab-button" @click="addUser">
      <van-icon name="plus" />
    </div>

    <!-- 编辑/新增弹窗 -->
    <van-popup v-model:show="showEditPopup" position="bottom" :style="{ height: '60%' }" round>
      <div class="popup-header">
        <span>{{ formData.id ? '编辑用户' : '新增用户' }}</span>
        <van-icon name="close" @click="showEditPopup = false" />
      </div>
      <div class="popup-content">
        <van-form @submit="onSave">
          <van-cell-group inset>
            <van-field
              v-model="formData.username"
              name="username"
              label="账号"
              placeholder="请输入账号"
              :rules="[
                { required: true, message: '请填写账号' },
                { pattern: /^[a-zA-Z0-9]{3,20}$/, message: '账号为3-20位的字母和数字' }
              ]"
            />
            <van-field
              v-model="formData.password"
              type="text"
              name="password"
              label="密码"
              :placeholder="formData.id ? '如不修改请留空' : '请输入密码'"
              :rules="passwordRules"
            />
            <van-field
              v-model="formData.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
              :rules="[{ required: true, message: '请填写姓名' }]"
            />
            <van-field
              v-model="formData.phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号"
              :rules="phoneRules"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { showToast, showDialog } from 'vant';
import { userApi } from '@/core/api/user';

const isApiSuccess = (response) => {
  if (!response || response.success !== true) return false;
  if (response.code === undefined || response.code === null) return true;
  const code = Number(response.code);
  if (Number.isNaN(code)) return true;
  return code >= 200 && code < 300;
};

// 状态
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const searchKeyword = ref('');
const showEditPopup = ref(false);

const showSearchBar = ref(true);
const lastScrollTop = ref(0);
const isAtTop = ref(true);

const searchType = ref('username');
const showSearchTypePopover = ref(false);
const searchTypeActions = [
  { text: '账号', value: 'username' }
];

// 表单数据
const formData = reactive({
  id: 0,
  username: '',
  password: '',
  name: '',
  phone: ''
});

// 密码规则：新增时必填，编辑时可选
const passwordRules = computed(() => {
  if (formData.id) {
    // 编辑模式：密码可选，但如果填了就要满足长度要求
    return [
      { 
        validator: (value) => {
          if (!value) return true; // 空值允许
          return /^.{6,20}$/.test(value);
        }, 
        message: '密码长度需为6-20个字符' 
      }
    ];
  }
  // 新增模式：必填
  return [
    { required: true, message: '请输入密码' },
    { pattern: /^.{6,20}$/, message: '密码长度需为6-20个字符' }
  ];
});

const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
];

// 密码掩码显示
const maskPassword = (password) => {
  if (!password) return '******';
  return '*'.repeat(Math.min(password.length, 8));
};

// 方法
const onLoad = async () => {
  if (refreshing.value) {
    list.value = [];
    refreshing.value = false;
  }

  try {
    const response = await userApi.list();
    let allItems = response.data || [];
    
    // 搜索过滤（按账号）
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      allItems = allItems.filter(item =>
        item.username && item.username.toLowerCase().includes(keyword)
      );
    }

    list.value = allItems;
    finished.value = true;
  } catch (error) {
    showToast('获取用户列表失败');
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

const currentSearchTypeLabel = computed(() => {
  const action = searchTypeActions.find(item => item.value === searchType.value);
  return action ? action.text : '账号';
});

const onSearchTypeSelect = (action) => {
  searchType.value = action.value;
  showSearchTypePopover.value = false;
  searchKeyword.value = '';
  onRefresh();
};

// 滚动监听
const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  
  // 更新是否在顶部状态
  isAtTop.value = scrollTop <= 5;
  
  if (scrollTop <= 10) {
    showSearchBar.value = true;
    lastScrollTop.value = scrollTop;
    return;
  }
  
  if (refreshing.value) return;
  
  const diff = scrollTop - lastScrollTop.value;
  
  if (diff > 10) {
    showSearchBar.value = false;
  } else if (diff < -10) {
    showSearchBar.value = true;
  }
  
  lastScrollTop.value = scrollTop;
};

const addUser = () => {
  Object.assign(formData, {
    id: 0,
    username: '',
    password: '',
    name: '',
    phone: ''
  });
  showEditPopup.value = true;
};

const editUser = (item) => {
  Object.assign(formData, {
    ...item,
    password: item.password || '' // 编辑时显示密码
  });
  showEditPopup.value = true;
};

const deleteUser = (item) => {
  const message =
    `账号：${item.username}\n` +
    `姓名：${item.name || '无'}\n` +
    `手机号：${item.phone || '无'}\n\n` +
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
      const response = await userApi.remove(item.id);

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
    // 如果密码为空，则不发送密码字段（后端通常处理逻辑：为空不修改）
    if (!payload.password && payload.id) {
      delete payload.password;
    }

    let response;
    if (payload.id) {
      response = await userApi.update(payload);
    } else {
      response = await userApi.create(payload);
    }
    
    if (isApiSuccess(response)) {
      showToast('操作成功');
      showEditPopup.value = false;
      onRefresh();
    } else {
      showToast(response && response.message ? response.message : '操作失败');
    }
  } catch (error) {
    showToast('操作失败');
  }
};

onMounted(() => {
  onRefresh();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.user-management {
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
  color: #3b82f6;
  font-weight: 600;
  background: #eff6ff;
}

/* 列表项 */
.user-item {
  margin: 0 16px 12px;
}

.user-card {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-username {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.user-row {
  display: flex;
  font-size: 13px;
  color: #6b7280;
}

.user-label {
  flex-shrink: 0;
  color: #9ca3af;
}

.user-value {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.user-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.user-card-actions :deep(.van-button) {
  border-radius: 20px;
  font-size: 13px;
}

.delete-button {
  height: 100%;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  z-index: 99;
}

.fab-button:active {
  transform: scale(0.95);
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
