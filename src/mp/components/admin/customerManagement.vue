<template>
  <div class="customer-management">
    <!-- 自定义标题栏 -->
    <div class="custom-header">
      <div class="header-back" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div class="header-title" ref="headerTitleEl">{{ pageTitle }}</div>
      <div class="header-actions">
        <van-icon name="search" size="20" @click="toggleSearchPanel" />
      </div>
    </div>
    
    <!-- 搜索面板 -->
    <transition name="slide-fade">
      <div class="search-panel" v-show="showSearchPanel">
        <div class="search-filters">
          <van-field 
            v-model="searchCompanyName" 
            placeholder="根据企业名称搜索" 
            clearable 
            class="search-field"
            left-icon="shop-o"
            @keyup="onSearchSubmit"
          />
          <van-field 
            v-model="searchContactName" 
            placeholder="根据联系人姓名搜索" 
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

    <!-- 客户列表 -->
    <div class="customer-list" :class="{ 'list-with-search': showSearchPanel }">
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
            class="customer-item"
            @click="editItem(item)"
          >
            <div class="customer-icon">
              <van-icon name="shop-o" size="24" color="#07c160" />
            </div>
            <div class="customer-info">
              <div class="customer-name">{{ item.companyName }}</div>
              <div class="customer-contacts">
                <div v-for="(contact, index) in item.contacts" :key="index" class="contact-item">
                  <van-icon name="contact" size="14" />
                  <span>{{ contact.contactName }} - {{ contact.phone }}</span>
                </div>
                <div v-if="!item.contacts || item.contacts.length === 0" class="empty-info">
                  <van-icon name="info-o" size="14" />
                  <span>暂无联系人</span>
                </div>
              </div>
              <div class="customer-addresses">
                <div v-for="(address, index) in item.addresses" :key="index" class="address-item">
                  <van-icon name="location-o" size="14" />
                  <span>{{ address.address }}</span>
                </div>
                <div v-if="!item.addresses || item.addresses.length === 0" class="empty-info">
                  <van-icon name="info-o" size="14" />
                  <span>暂无地址</span>
                </div>
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
      :style="{ height: '85%' }"
    >
      <div class="dialog-title">{{ formData.id ? '编辑客户信息' : '新增客户信息' }}</div>
      <van-form @submit="onFormSubmit" class="edit-form">
        <!-- 表单字段 -->
        <van-cell-group inset class="form-group">
          <van-field
            v-model="formData.companyName"
            name="companyName"
            label="企业名称"
            placeholder="请输入企业名称"
            left-icon="shop-o"
            :rules="rules.companyName"
          />
        </van-cell-group>

        <!-- 地址信息 -->
        <div class="section-title">
          地址信息
          <van-button type="primary" size="mini" plain icon="plus" @click="addAddress">添加地址</van-button>
        </div>
        <van-cell-group inset class="form-group" v-for="(address, index) in formData.addresses" :key="`address-${index}`">
          <van-field
            v-model="address.address"
            name="address"
            label="地址"
            placeholder="请输入详细地址（选填）"
            left-icon="location-o"
          >
            <template #right-icon>
              <van-icon 
                v-if="formData.addresses.length > 1" 
                name="delete-o" 
                class="delete-icon" 
                @click.stop="removeAddress(index)" 
              />
            </template>
          </van-field>
        </van-cell-group>

        <!-- 联系人信息 -->
        <div class="section-title">
          联系人信息
          <van-button type="primary" size="mini" plain icon="plus" @click="addContact">添加联系人</van-button>
        </div>
        <van-cell-group inset class="form-group" v-for="(contact, index) in formData.contacts" :key="`contact-${index}`">
          <van-field
            v-model="contact.contactName"
            name="contactName"
            label="姓名"
            placeholder="请输入联系人姓名（选填）"
            left-icon="contact"
          />
          <van-field
            v-model="contact.phone"
            name="phone"
            label="电话"
            placeholder="请输入联系电话（选填）"
            left-icon="phone-o"
            :rules="rules.phone"
          >
            <template #right-icon>
              <van-icon 
                v-if="formData.contacts.length > 1" 
                name="delete-o" 
                class="delete-icon" 
                @click.stop="removeContact(index)" 
              />
            </template>
          </van-field>
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" icon="success">确认保存</van-button>
          <van-button v-if="formData.id" round block type="danger" icon="delete" @click="showDeleteConfirm">删除客户</van-button>
        </div>
      </van-form>
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
        <p class="warning-title">
          <van-icon name="warning-o" color="#ee0a24" />
          确认删除以下客户？
        </p>
        <div class="delete-content">
          <p class="delete-item">企业名称：{{ deleteItemData.companyName }}</p>
          <p class="delete-item">联系人：{{ deleteItemData.contactCount }}人</p>
          <p class="delete-item">地址：{{ deleteItemData.addressCount }}个</p>
        </div>
        <div class="delete-related" v-if="deleteItemData.sampleCount > 0 || deleteItemData.orderCount > 0">
          <p class="related-title">
            <van-icon name="warning-o" /> 删除后相关样品、订单的"客户信息"将会同时删除：
          </p>
          <p class="related-item" v-if="deleteItemData.sampleCount > 0">
            所有关联的样品数据{{ deleteItemData.sampleCount }}个样品
          </p>
          <p class="related-item" v-if="deleteItemData.orderCount > 0">
            所有关联的订单数据{{ deleteItemData.orderCount }}个订单
          </p>
        </div>
        <p class="delete-warning-text">
          <van-icon name="info-o" /> 此操作不可恢复，请谨慎操作！
        </p>
      </div>
    </van-dialog>
    
    <!-- 二次确认弹窗 -->
    <van-dialog
      v-model:show="showSecondConfirmDialog"
      title="危险操作确认"
      show-cancel-button
      confirm-button-text="确认删除"
      confirm-button-color="#ee0a24"
      cancel-button-text="取消"
      @confirm="executeDelete"
    >
      <div class="delete-warning">
        <p class="second-confirm-title">您确定要删除此客户吗？</p>
        <p class="delete-item">企业名称：{{ deleteItemData.companyName }}</p>
        <p class="delete-item danger">关联样品数：{{ deleteItemData.sampleCount }}</p>
        <p class="delete-item danger">关联订单数：{{ deleteItemData.orderCount }}</p>
        <p class="delete-warning-text">
          <van-icon name="warning-o" /> 所有相关样品和订单的"客户信息"将被永久删除，且不可恢复！
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

const route = useRoute();
const router = useRouter();

// 模板引用
const headerTitleEl = ref(null);

// 页面标题和通知
const notificationMessage = ref('');
const pageTitle = computed(() => {
  if (notificationMessage.value) {
    return notificationMessage.value;
  }
  const adminRoute = adminRoutes[0];
  const currentRouteName = route.name;
  if (adminRoute?.children) {
    const childRoute = adminRoute.children.find(child => child.name === currentRouteName);
    if (childRoute?.meta?.title) {
      return childRoute.meta.title;
    }
  }
  return route.meta.title || '客户管理';
});

const goBack = () => router.back();

const showTitleNotification = (message, duration = 2000) => {
  notificationMessage.value = message;
  
  if (headerTitleEl.value) {
    headerTitleEl.value.classList.add('notification-active');
    setTimeout(() => {
      headerTitleEl.value.classList.remove('notification-active');
    }, duration);
  }
  
  setTimeout(() => {
    notificationMessage.value = '';
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
    y: touch.clientY - btnPosition.value.top,
  };
};

const onDrag = (event) => {
  if (!isDragging.value) return;
  event.preventDefault();
  
  const touch = event.touches[0];
  const btnSize = 56;
  const padding = 10;
  
  const left = Math.min(
    Math.max(touch.clientX - dragOffset.value.x, padding),
    window.innerWidth - btnSize - padding
  );
  
  const top = Math.min(
    Math.max(touch.clientY - dragOffset.value.y, padding),
    window.innerHeight - btnSize - padding
  );
  
  btnPosition.value = { left, top };
};

const endDrag = () => {
  isDragging.value = false;
};

// 搜索
const showSearchPanel = ref(false);
const searchCompanyName = ref('');
const searchContactName = ref('');

const onSearchSubmit = (event) => {
  if (event.key === 'Enter') {
    event.target.blur();
    handleSearch();
  }
};

const toggleSearchPanel = () => {
  showSearchPanel.value = !showSearchPanel.value;
};

const handleSearch = () => {
  currentPage.value = 1;
  loadFilteredItems();
  showTitleNotification('搜索完成');
  showSearchPanel.value = false;
};

const resetSearch = () => {
  searchCompanyName.value = '';
  searchContactName.value = '';
  currentPage.value = 1;
  loadFilteredItems();
  showTitleNotification('已重置搜索条件');
};

const getPinyin = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');
};

const getPinyinInitials = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');
};

const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  const searchLower = searchTerm.toLowerCase();
  return text.toLowerCase().includes(searchLower) || 
         getPinyin(text).toLowerCase().includes(searchLower) || 
         getPinyinInitials(text).toLowerCase().includes(searchLower);
};

// 客户列表
const items = ref([]);
const displayItems = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const pageSize = ref(10);
const currentPage = ref(1);

const filteredItems = computed(() => {
  let filtered = items.value;

  if (searchCompanyName.value) {
    filtered = filtered.filter(item => matchesSearch(item.companyName, searchCompanyName.value));
  }
  
  if (searchContactName.value) {
    filtered = filtered.filter(item => 
      item.contacts?.some(contact => matchesSearch(contact.contactName, searchContactName.value))
    );
  }

  return filtered;
});

const onLoad = () => {
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    
    if (start >= filteredItems.value.length) {
      finished.value = true;
      loading.value = false;
      return;
    }
    
    displayItems.value.push(...filteredItems.value.slice(start, start + pageSize.value));
    currentPage.value++;
    loading.value = false;
    finished.value = displayItems.value.length >= filteredItems.value.length;
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
  
  loadItems(fromOperation).then(() => {
    refreshing.value = false;
    loadFilteredItems();
    
    if (!fromOperation) {
      showTitleNotification('刷新成功');
    }
  });
};

const loadItems = async (fromOperation = false) => {
  try {
    loading.value = true;
    const response = await request.get('/customers');
    const RESERVED_IDS = [1, 2];
    items.value = (response.data || []).filter(c => !RESERVED_IDS.includes(c.id));
    return { ...response, fromOperation };
  } catch (error) {
    showToast(error.response?.data?.message || '加载客户列表失败');
    return { success: false, fromOperation };
  } finally {
    loading.value = false;
  }
};

// 表单
const showDialog = ref(false);
const formData = ref(getDefaultFormData());

function getDefaultFormData() {
  return {
    id: null,
    companyName: '',
    addresses: [{ address: '' }],
    contacts: [{ contactName: '', phone: '' }],
  };
}

const validatePhone = value => {
  if (!value) return true;
  if (!/^\d{11}$|^\d{3}-\d{7}$/.test(value)) {
    return '电话格式应为11位数字或XXX-XXXXXXX';
  }
  return true;
};

const validateCompanyName = value => {
  if (!value) {
    return '请输入企业名称';
  } else if (value.length < 1 || value.length > 50) {
    return '企业名称长度在1到50个字符';
  }
  return true;
};

const rules = {
  companyName: [{ required: true, validator: validateCompanyName, trigger: 'onBlur' }],
  phone: [{ validator: validatePhone, trigger: 'onBlur' }]
};

const addItem = () => {
  formData.value = getDefaultFormData();
  showDialog.value = true;
};

const editItem = async (item) => {
  try {
    const response = await request.get(`/customers/${item.id}`);
    const customerData = response.data;
    
    if (!customerData.addresses?.length) {
      customerData.addresses = [{ address: '' }];
    }
    
    if (!customerData.contacts?.length) {
      customerData.contacts = [{ contactName: '', phone: '' }];
    }
    
    formData.value = customerData;
    showDialog.value = true;
  } catch (error) {
    showToast('获取客户详情失败');
  }
};

const addAddress = () => formData.value.addresses.push({ address: '' });
const removeAddress = (index) => {
  if (formData.value.addresses.length > 1) {
    formData.value.addresses.splice(index, 1);
  } else {
    formData.value.addresses[0].address = '';
  }
};

const addContact = () => formData.value.contacts.push({ contactName: '', phone: '' });
const removeContact = (index) => {
  if (formData.value.contacts.length > 1) {
    formData.value.contacts.splice(index, 1);
  } else {
    formData.value.contacts[0] = { contactName: '', phone: '' };
  }
};

const onFormSubmit = async () => {
  try {
    const data = {
      companyName: formData.value.companyName,
      addresses: formData.value.addresses.filter(a => a.address?.trim()),
      contacts: formData.value.contacts.filter(c => c.contactName?.trim() || c.phone?.trim()),
    };

    const response = formData.value.id
      ? await request.put(`/customers/${formData.value.id}`, data)
      : await request.post('/customers', data);
    
    showTitleNotification(response.message);
    showDialog.value = false;
    onRefresh(true);
  } catch (error) {
    showToast(error.response?.data?.message || '保存失败，请检查数据');
  }
};

// 删除
const showDeleteDialog = ref(false);
const showSecondConfirmDialog = ref(false);
const deleteItemData = ref({
  id: null,
  companyName: '',
  contactCount: 0,
  addressCount: 0,
  sampleCount: 0,
  orderCount: 0,
});

const showDeleteConfirm = async () => {
  try {
    const customerId = formData.value.id;
    const [sampleResponse, orderResponse] = await Promise.all([
      request.get(`/customers/${customerId}/samples/count`),
      request.get(`/customers/${customerId}/orders/count`)
    ]);
    
    deleteItemData.value = {
      id: customerId,
      companyName: formData.value.companyName,
      contactCount: formData.value.contacts?.filter(c => c.contactName?.trim() || c.phone?.trim()).length || 0,
      addressCount: formData.value.addresses?.filter(a => a.address?.trim()).length || 0,
      sampleCount: sampleResponse.data || 0,
      orderCount: orderResponse.data || 0,
    };

    showDeleteDialog.value = true;
  } catch (error) {
    showToast('检查客户关联数据失败');
  }
};

const confirmDelete = () => {
  showDeleteDialog.value = false;
  if (deleteItemData.value.sampleCount > 0 || deleteItemData.value.orderCount > 0) {
    showSecondConfirmDialog.value = true;
  } else {
    executeDelete();
  }
};

const executeDelete = async () => {
  try {
    const idToDelete = deleteItemData.value.id;
    const response = await request.delete(`/customers/${idToDelete}`);
    
    showTitleNotification(response.message);

    const index = items.value.findIndex(item => item.id === idToDelete);
    if (index > -1) {
      items.value.splice(index, 1);
    }
    
    [showDialog, showDeleteDialog, showSecondConfirmDialog].forEach(ref => { ref.value = false });
    loadFilteredItems(); // Re-render list immediately with local data
    onRefresh(true); // Sync with server in background
  } catch (error) {
    showToast(error?.response?.data?.message || '删除失败');
  }
};

onMounted(() => {
  loadItems().then(() => {
    loadFilteredItems();
  });
});
</script>

<style scoped>
.customer-management {
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

.customer-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  margin-top: 0;
  transition: margin-top 0.3s ease;
}

.list-with-search {
  margin-top: 200px;
}

.customer-item {
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

.customer-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.customer-icon {
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

.customer-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.customer-contacts, .customer-addresses {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-item, .address-item {
  font-size: 13px;
  color: #646566;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-info {
  color: #b2b2b2;
  font-size: 12px;
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

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin: 18px 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-icon {
  color: #ee0a24;
  font-size: 18px;
  margin-left: 8px;
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
  padding: 16px;
}

.warning-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.delete-content {
  background: #f7f8fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.delete-item {
  font-size: 14px;
  color: #323233;
  margin: 8px 0;
}

.delete-related {
  background: #fff8f8;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.related-title {
  color: #ee0a24;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.related-item {
  color: #ee0a24;
  font-size: 14px;
  margin: 4px 0 4px 24px;
}

.delete-warning-text {
  color: #969799;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  margin-top: 16px;
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
</style> 