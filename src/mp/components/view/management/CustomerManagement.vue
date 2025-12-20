<template>
  <div class="customer-management">
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
        <div v-for="item in list" :key="item.id" class="customer-item">
          <van-swipe-cell>
            <div class="customer-card" @click="editCustomer(item)">
              <div class="customer-info">
                <div class="customer-name">{{ item.companyName }}</div>

                <div class="customer-contact-row">
                  <span class="contact-label">联系人：</span>
                  <span class="contact-name">
                    {{ (item.contacts && item.contacts[0] && item.contacts[0].contactName) || '暂无联系人' }}
                  </span>
                  <span class="contact-phone">
                    {{ (item.contacts && item.contacts[0] && item.contacts[0].phone) || '' }}
                  </span>
                </div>

                <div class="customer-address-row">
                  <span class="address-label">地址：</span>
                  <span class="address-text">
                    {{ (item.addresses && item.addresses[0] && item.addresses[0].address) || '暂无地址' }}
                  </span>
                </div>

                <div class="customer-card-actions">
                  <van-button size="small" plain @click.stop="editCustomer(item)">编辑</van-button>
                  <van-button size="small" type="danger" plain @click.stop="deleteCustomer(item)">删除</van-button>
                </div>
              </div>
            </div>
            <template #right>
              <van-button square text="删除" type="danger" class="delete-button" @click="deleteCustomer(item)" />
            </template>
          </van-swipe-cell>
        </div>
      </van-list>

    <!-- 悬浮按钮 - 新增 -->
    <div class="fab-button" @click="addCustomer">
      <van-icon name="plus" />
    </div>

    <!-- 编辑/新增弹窗 -->
    <van-popup v-model:show="showEditPopup" position="bottom" :style="{ height: '90%' }" round>
      <div class="popup-header">
        <span>{{ formData.id ? '编辑客户' : '新增客户' }}</span>
        <van-icon name="close" @click="showEditPopup = false" />
      </div>
      <div class="popup-content">
        <van-form @submit="onSave">
          <van-cell-group inset title="基本信息">
            <van-field
              v-model="formData.companyName"
              name="companyName"
              label="企业名称"
              placeholder="请输入企业名称"
              :rules="companyNameRules"
            />
          </van-cell-group>

          <van-cell-group inset title="联系人信息">
            <div v-for="(contact, index) in formData.contacts" :key="index" class="dynamic-group">
              <van-field
                v-model="contact.contactName"
                label="姓名"
                placeholder="联系人姓名"
              />
              <van-field
                v-model="contact.phone"
                label="电话"
                placeholder="联系电话"
                :rules="phoneRules"
              />
              <div class="group-actions" v-if="formData.contacts.length > 1">
                <van-button size="mini" type="danger" plain @click="removeContact(index)">删除联系人</van-button>
              </div>
              <div v-if="index < formData.contacts.length - 1" class="form-divider"></div>
            </div>
            <div class="add-action">
              <van-button size="small" icon="plus" block plain type="primary" @click="addContact">添加联系人</van-button>
            </div>
          </van-cell-group>

          <van-cell-group inset title="地址信息">
            <div v-for="(address, index) in formData.addresses" :key="index" class="dynamic-group">
              <van-field
                v-model="address.address"
                label="地址"
                placeholder="详细地址"
                type="textarea"
                rows="1"
                autosize
              />
              <div class="group-actions" v-if="formData.addresses.length > 1">
                <van-button size="mini" type="danger" plain @click="removeAddress(index)">删除地址</van-button>
              </div>
              <div v-if="index < formData.addresses.length - 1" class="form-divider"></div>
            </div>
            <div class="add-action">
              <van-button size="small" icon="plus" block plain type="primary" @click="addAddress">添加地址</van-button>
            </div>
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { showToast, showDialog } from 'vant';
import { customerApi } from '@/core/api/customer';
import { fuzzySearch } from '@/core/utils/pinyin';
import { saveDraft, getDraft, clearDraft, hasDraft, getDraftInfo } from '@/core/utils/formDraft';

// 草稿配置
const DRAFT_NAME = 'mp_customer';

// 常量
const RESERVED_IDS = [1, 2];

const PHONE_REGEX = /^\d{11}$|^\d{3}-\d{7}$/;

const phoneRules = [
  {
    validator: (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    },
    message: '电话格式应为11位数字或XXX-XXXXXXX'
  }
];

const companyNameRules = [
  { required: true, message: '请填写企业名称' },
  {
    validator: (value) => {
      if (!value) return false;
      const length = String(value).trim().length;
      return length >= 1 && length <= 50;
    },
    message: '企业名称长度在1到50个字符'
  }
];

const isApiSuccess = (response) => {
  if (!response || response.success !== true) return false;
  if (response.code === undefined || response.code === null) return true;
  const code = Number(response.code);
  if (Number.isNaN(code)) return true;
  return code >= 200 && code < 300;
};

const currentSearchTypeLabel = computed(() => {
  const action = searchTypeActions.find(item => item.value === searchType.value);
  return action ? action.text : '企业';
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

// 状态
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const searchKeyword = ref('');
const showEditPopup = ref(false);

const showSearchBar = ref(true);
const lastScrollTop = ref(0);

const searchType = ref('company');
const showSearchTypePopover = ref(false);
const searchTypeActions = [
  { text: '企业', value: 'company' },
  { text: '联系人', value: 'contact' }
];

// 表单数据
const formData = reactive({
  id: null,
  companyName: '',
  contacts: [{ contactName: '', phone: '' }],
  addresses: [{ address: '' }]
});

// 方法
const onLoad = async () => {
  try {
    const response = await customerApi.list();
    let allItems = response.data || [];
    
    // 过滤保留ID
    allItems = allItems.filter(c => !RESERVED_IDS.includes(c.id));

    // 搜索过滤
    if (searchKeyword.value) {
      const keyword = searchKeyword.value;
      allItems = allItems.filter(item => {
        if (searchType.value === 'company') {
          return fuzzySearch(item.companyName, keyword);
        }

        if (searchType.value === 'contact') {
          if (!item.contacts || !item.contacts.length) return false;
          const names = item.contacts
            .map(c => c && c.contactName ? c.contactName : '')
            .join(' ');
          return fuzzySearch(names, keyword);
        }

        return fuzzySearch(item.companyName, keyword);
      });
    }

    list.value = allItems;
    finished.value = true;
  } catch (error) {
    console.error(error);
    showToast('加载失败');
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

const addCustomer = async () => {
  Object.assign(formData, {
    id: null,
    companyName: '',
    contacts: [{ contactName: '', phone: '' }],
    addresses: [{ address: '' }]
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

const editCustomer = async (item) => {
  try {
    const response = await customerApi.getById(item.id);
    const data = response.data;
    Object.assign(formData, {
      id: data.id,
      companyName: data.companyName,
      contacts: data.contacts && data.contacts.length ? data.contacts : [{ contactName: '', phone: '' }],
      addresses: data.addresses && data.addresses.length ? data.addresses : [{ address: '' }]
    });
    showEditPopup.value = true;
  } catch (error) {
    showToast('获取详情失败');
  }
};

const deleteCustomer = async (item) => {
  let sampleCount = 0;
  let orderCount = 0;
  const contactCount = item.contacts && item.contacts.length ? item.contacts.length : 0;
  const addressCount = item.addresses && item.addresses.length ? item.addresses.length : 0;

  try {
    const [sampleResponse, orderResponse] = await Promise.all([
      customerApi.countSamples(item.id),
      customerApi.countOrders(item.id)
    ]);

    sampleCount = sampleResponse.data || 0;
    orderCount = orderResponse.data || 0;
  } catch (error) {
    showToast('获取客户关联数据失败');
    return;
  }

  const baseMessage =
    `企业名称：${item.companyName}\n` +
    `联系人：${contactCount} 人\n` +
    `地址：${addressCount} 个\n\n` +
    `相关样品：${sampleCount} 个\n` +
    `相关订单：${orderCount} 个\n\n` +
    `删除后，该客户及其关联样品、订单中的“客户信息”将被删除，操作不可恢复。`;

  try {
    await showDialog({
      title: '删除确认',
      message: baseMessage,
      showCancelButton: true,
      messageAlign: 'left',
      confirmButtonText: '继续删除',
      cancelButtonText: '取消'
    });
  } catch (error) {
    return;
  }

  if (sampleCount > 0 || orderCount > 0) {
    try {
      await showDialog({
        title: '二次确认',
        message: `该客户关联了 ${sampleCount} 个样品、${orderCount} 个订单，所有相关“客户信息”将被永久删除，确定继续吗？`,
        showCancelButton: true,
        messageAlign: 'left',
        confirmButtonText: '确认删除',
        cancelButtonText: '返回'
      });
    } catch (error) {
      return;
    }
  }

  try {
    const response = await customerApi.remove(item.id);

    if (isApiSuccess(response)) {
      showToast('删除成功');
      onRefresh();
    } else {
      showToast(response && response.message ? response.message : '删除失败');
    }
  } catch (error) {
    showToast('删除失败');
  }
};

// 动态表单操作
const addContact = () => {
  formData.contacts.push({ contactName: '', phone: '' });
};

const removeContact = (index) => {
  if (formData.contacts.length > 1) {
    formData.contacts.splice(index, 1);
  } else {
    formData.contacts[0] = { contactName: '', phone: '' };
  }
};

const addAddress = () => {
  formData.addresses.push({ address: '' });
};

const removeAddress = (index) => {
  if (formData.addresses.length > 1) {
    formData.addresses.splice(index, 1);
  } else {
    formData.addresses[0].address = '';
  }
};

const onSave = async () => {
  try {
    // 清理空数据并去除首尾空格
    const contacts = formData.contacts
      .map(c => ({
        contactName: (c.contactName || '').trim(),
        phone: (c.phone || '').trim()
      }))
      .filter(c => c.contactName || c.phone);

    const addresses = formData.addresses
      .map(a => ({
        address: (a.address || '').trim()
      }))
      .filter(a => a.address);

    const payload = {
      companyName: (formData.companyName || '').trim(),
      contacts: contacts.length ? contacts : [{ contactName: '', phone: '' }],
      addresses: addresses.length ? addresses : [{ address: '' }]
    };

    const isUpdate = !!formData.id;
    let response;

    if (isUpdate) {
      response = await customerApi.update(formData.id, payload);
    } else {
      response = await customerApi.create(payload);
    }

    if (isApiSuccess(response)) {
      showToast(isUpdate ? '更新成功' : '添加成功');
      clearDraft(DRAFT_NAME);  // 提交成功后清除草稿
      showEditPopup.value = false;
      onRefresh();
    } else {
      showToast(response && response.message ? response.message : (isUpdate ? '更新失败' : '添加失败'));
    }
  } catch (error) {
    showToast('保存失败');
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

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('mp-refresh', onRefresh);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mp-refresh', onRefresh);
});
</script>

<style scoped>
.customer-management {
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

.search-input :deep(.van-field__control) {
  font-size: 14px;
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
  color: #0f766e;
  font-weight: 600;
  background: #f0fdfa;
}

/* 列表项 */
.customer-item {
  margin: 0 16px 12px;
}

.customer-card {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.customer-contact-row,
.customer-address-row {
  display: flex;
  font-size: 13px;
  color: #6b7280;
}

.contact-label,
.address-label {
  flex-shrink: 0;
  color: #9ca3af;
}

.contact-name {
  margin-left: 4px;
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.contact-phone {
  margin-left: 8px;
  color: #0f766e;
}

.address-text {
  margin-left: 4px;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.customer-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.customer-card-actions :deep(.van-button) {
  border-radius: 20px;
  font-size: 13px;
}

.delete-button {
  height: 100%;
}

.info-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.info-text {
  margin-left: 4px;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 4px 20px rgba(15, 118, 110, 0.3);
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

.dynamic-group {
  padding: 12px 0;
}

.group-actions {
  padding: 0 16px;
  text-align: right;
  margin-top: 10px;
}

.add-action {
  padding: 12px 16px;
}

.add-action :deep(.van-button) {
  border-radius: 10px;
}

.form-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 12px 16px;
}
</style>
