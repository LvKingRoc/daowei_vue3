<template>
  <div class="employee-management">
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
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
        <div v-for="item in list" :key="item.id" class="employee-item">
          <van-swipe-cell>
            <div class="employee-card" @click="editEmployee(item)">
              <div class="employee-info">
                <div class="employee-header-row">
                  <div class="employee-name">{{ item.name }}</div>
                  <div class="employee-tags">
                    <van-tag plain type="primary" style="margin-right: 4px;">
                      {{ item.gender === 'male' ? '男' : '女' }}
                    </van-tag>
                    <van-tag plain type="success">{{ getAgeFromIdCard(item.idCard) }}岁</van-tag>
                  </div>
                </div>

                <div class="info-row">
                  <span class="label">电话：</span>
                  <span class="info-text">{{ item.phone || '无电话' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">邮箱：</span>
                  <span class="info-text">{{ item.email || '无邮箱' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">入职日期：</span>
                  <span class="info-text">{{ formatDate(item.hireDate) }}</span>
                </div>

                <div class="employee-card-actions">
                  <van-button size="small" plain @click.stop="editEmployee(item)">编辑</van-button>
                  <van-button size="small" type="danger" plain @click.stop="deleteEmployee(item)">删除</van-button>
                </div>
              </div>
            </div>
            <template #right>
              <van-button square text="删除" type="danger" class="delete-button" @click="deleteEmployee(item)" />
            </template>
          </van-swipe-cell>
        </div>
      </van-list>

    <!-- 悬浮按钮 - 新增 -->
    <div class="fab-button" @click="addEmployee">
      <van-icon name="plus" />
    </div>

    <!-- 编辑/新增弹窗 -->
    <van-popup v-model:show="showEditPopup" position="bottom" :style="{ height: '90%' }" round>
      <div class="popup-header">
        <span>{{ formData.id ? '编辑员工' : '新增员工' }}</span>
        <van-icon name="close" @click="showEditPopup = false" />
      </div>
      <div class="popup-content">
        <van-form @submit="onSave">
          <van-cell-group inset>
            <van-field
              v-model="formData.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
              :rules="[{ required: true, message: '请填写姓名' }]"
            />
            <van-field name="gender" label="性别">
              <template #input>
                <van-radio-group v-model="formData.gender" direction="horizontal">
                  <van-radio name="male">男</van-radio>
                  <van-radio name="female">女</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model="formData.phone"
              name="phone"
              label="联系电话"
              placeholder="请输入联系电话"
              :rules="[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]"
            />
            <van-field
              v-model="formData.idCard"
              name="idCard"
              label="身份证号"
              placeholder="请输入身份证号"
              :rules="[{ pattern: /^\d{17}[\dXx]$/, message: '请输入有效的身份证号' }]"
            />
            <van-field
              v-model="formData.email"
              name="email"
              label="邮箱"
              placeholder="请输入邮箱"
              :rules="[{ pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '邮箱格式不正确' }]"
            />
            <van-field
              v-model="formData.hireDate"
              is-link
              readonly
              name="hireDate"
              label="入职日期"
              placeholder="点击选择日期"
              @click="openDatePicker"
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
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="currentDatePickerValue"
        :min-date="new Date(2015, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { showToast, showDialog } from 'vant';
import { employeeApi } from '@/core/api/employee';
import { fuzzySearch } from '@/core/utils/pinyin';
import dayjs from 'dayjs';
import { saveDraft, getDraft, clearDraft, hasDraft, getDraftInfo } from '@/core/utils/formDraft';

// 草稿配置
const DRAFT_NAME = 'mp_employee';

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
const searchKeyword = ref('');
const showEditPopup = ref(false);
const showDatePicker = ref(false);
const currentDatePickerValue = ref([]);

const showSearchBar = ref(true);
const lastScrollTop = ref(0);

const searchType = ref('name');
const showSearchTypePopover = ref(false);
const searchTypeActions = [
  { text: '姓名', value: 'name' },
  { text: '电话', value: 'phone' }
];

// 表单数据
const formData = reactive({
  id: 0,
  name: '',
  gender: 'male',
  phone: '',
  email: '',
  idCard: '',
  hireDate: ''
});

// 工具函数
const formatDate = (dateStr) => dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '无';

const getAgeFromIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return 0;
  const birthYear = idCard.slice(6, 10);
  const currentYear = dayjs().year();
  return currentYear - Number(birthYear);
};

const currentSearchTypeLabel = computed(() => {
  const action = searchTypeActions.find(item => item.value === searchType.value);
  return action ? action.text : '姓名';
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

// 方法
const onLoad = async () => {
  try {
    const response = await employeeApi.list();
    let allItems = response.data || [];
    
    // 搜索过滤
    if (searchKeyword.value) {
      const keyword = searchKeyword.value;
      allItems = allItems.filter(item => {
        if (searchType.value === 'name') {
          return fuzzySearch(item.name, keyword);
        }
        if (searchType.value === 'phone') {
          return fuzzySearch(item.phone, keyword);
        }
        return fuzzySearch(item.name, keyword);
      });
    }

    list.value = allItems;
    finished.value = true;
  } catch (error) {
    showToast('获取员工列表失败');
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

const addEmployee = async () => {
  Object.assign(formData, {
    id: 0,
    name: '',
    gender: 'male',
    phone: '',
    email: '',
    idCard: '',
    hireDate: dayjs().format('YYYY-MM-DD')
  });
  
  // 检查是否有草稿
  if (hasDraft(DRAFT_NAME, { isEdit: false })) {
    const draftInfo = getDraftInfo(DRAFT_NAME);
    try {
      await showDialog({
        title: '发现未保存的草稿',
        message: `${draftInfo?.timeAgo || '之前'}有未保存的内容，是否恢复？`,
        showCancelButton: true,
        confirmButtonText: '恢复草稿',
        cancelButtonText: '放弃草稿'
      });
      const draft = getDraft(DRAFT_NAME, { isEdit: false });
      if (draft) {
        Object.assign(formData, draft);
      }
    } catch {
      clearDraft(DRAFT_NAME);
    }
  }
  
  showEditPopup.value = true;
};

const editEmployee = (item) => {
  Object.assign(formData, item);
  // 格式化日期以匹配 DatePicker
  if (formData.hireDate) {
    formData.hireDate = dayjs(formData.hireDate).format('YYYY-MM-DD');
  }
  showEditPopup.value = true;
};

const deleteEmployee = (item) => {
  const message =
    `姓名：${item.name}\n` +
    `电话：${item.phone || '无'}\n\n` +
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
      const response = await employeeApi.remove(item.id);

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

// 打开日期选择器并设置默认值
const openDatePicker = () => {
  if (formData.hireDate) {
    const parts = formData.hireDate.split('-');
    currentDatePickerValue.value = parts;
  } else {
    const today = new Date();
    currentDatePickerValue.value = [
      String(today.getFullYear()),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ];
  }
  showDatePicker.value = true;
};

const onDateConfirm = ({ selectedValues }) => {
  formData.hireDate = selectedValues.join('-');
  showDatePicker.value = false;
};

const onSave = async () => {
  try {
    const payload = { ...formData };

    let response;
    if (payload.id) {
      response = await employeeApi.update(payload.id, payload);
    } else {
      response = await employeeApi.create(payload);
    }

    if (isApiSuccess(response)) {
      showToast('操作成功');
      clearDraft(DRAFT_NAME);  // 提交成功后清除草稿
      showEditPopup.value = false;
      onRefresh();
    } else {
      showToast(response && response.message ? response.message : '操作失败');
    }
  } catch (error) {
    showToast('操作失败');
  }
};

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

onMounted(() => {
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
.employee-management {
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
  color: #4f46e5;
  font-weight: 600;
  background: #eef2ff;
}

/* 列表项 */
.employee-item {
  margin: 0 16px 12px;
}

.employee-card {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.employee-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.employee-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.employee-tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.employee-tags :deep(.van-tag) {
  border-radius: 12px;
  padding: 2px 8px;
}

.delete-button {
  height: 100%;
}

.info-row {
  display: flex;
  font-size: 13px;
  color: #6b7280;
}

.label {
  flex-shrink: 0;
  color: #9ca3af;
  margin-right: 4px;
}

.info-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.employee-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.employee-card-actions :deep(.van-button) {
  border-radius: 20px;
  font-size: 13px;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
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
