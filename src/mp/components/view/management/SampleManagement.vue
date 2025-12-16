<template>
  <div class="sample-management">
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
    <div class="sample-list-wrapper">
      <van-loading v-if="loading" size="24px" class="list-loading">加载中...</van-loading>
        <template v-else>
          <div v-if="!list.length" class="list-empty">
            <van-empty description="暂无样品" />
          </div>
          <div v-else>
            <div v-for="item in list" :key="item.id" class="sample-item">
            <van-swipe-cell>
              <div class="sample-card" @click="editItem(item)">
                <div class="sample-thumb" v-if="getItemImageUrl(item)" @click.stop="previewImage(getItemImageUrl(item))">
                  <van-image
                    :src="getItemImageUrl(item)"
                    fit="cover"
                    width="80"
                    height="80"
                    radius="10"
                    lazy-load
                  />
                </div>
                <div class="sample-thumb sample-thumb-empty" v-else>
                  <van-icon name="photo-o" size="24" color="#cbd5f5" />
                </div>

                <div class="sample-info">
                  <div class="sample-model">{{ item.model }}</div>
                  <div class="sample-company">
                    客户：{{ item.companyName || '无客户' }}
                  </div>

                  <div class="sample-meta-row">
                    <div class="meta-line">
                      <div class="meta-left">
                        别称：{{ item.alias || '无别称' }}
                      </div>
                      <div class="meta-right">
                        <span class="metric-label">库存：</span>
                        <span class="metric-value stock">{{ item.stock }}</span>
                      </div>
                    </div>
                    <div class="meta-line">
                      <div class="meta-left">
                        颜色：{{ item.colorCode || '无颜色' }}
                      </div>
                      <div class="meta-right">
                        <span class="metric-label">单价：</span>
                        <span class="metric-value price">{{ item.unitPrice?.toFixed(2) || '0.00' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="sample-card-actions">
                    <van-button size="small" type="primary" @click.stop="addOrder(item)">下单</van-button>
                    <van-button size="small" plain @click.stop="editItem(item)">编辑</van-button>
                    <van-button size="small" type="danger" plain @click.stop="deleteItem(item)">删除</van-button>
                  </div>
                </div>
              </div>
              <template #right>
                <van-button square text="删除" type="danger" class="delete-button" @click="deleteItem(item)" />
              </template>
            </van-swipe-cell>
          </div>
        </div>
      </template>
    </div>

    <!-- 悬浮按钮 - 新增 -->
    <div class="fab-button" @click="addItem">
      <van-icon name="plus" />
    </div>

    <!-- 编辑/新增弹窗 -->
    <van-popup v-model:show="showEditPopup" position="bottom" :style="{ height: '90%' }" round>
      <div class="popup-header">
        <span>{{ formData.id ? '编辑样品' : '新增样品' }}</span>
        <van-icon name="close" @click="showEditPopup = false" />
      </div>
      <div class="popup-content">
        <van-form @submit="onSave">
          <div class="image-upload-section">
            <div class="image-preview-container">
              <!-- 有图片时显示预览和操作按钮 -->
              <template v-if="fileList.length > 0">
                <van-image
                  :src="fileList[0].url || fileList[0].content"
                  fit="cover"
                  width="120"
                  height="120"
                  radius="12"
                  class="preview-image"
                />
                <div class="image-action-buttons">
                  <van-button size="small" type="primary" @click="triggerUpload">修改</van-button>
                  <van-button size="small" type="danger" plain @click="removeImage">删除</van-button>
                </div>
              </template>
              <!-- 无图片时显示上传按钮 -->
              <template v-else>
                <div class="upload-placeholder" @click="triggerUpload">
                  <van-icon name="photograph" size="40" color="#cbd5f5" />
                  <span class="upload-placeholder-text">点击上传图片</span>
                </div>
              </template>
            </div>
            <!-- 隐藏的上传组件 -->
            <van-uploader 
              ref="uploaderRef"
              v-model="fileList" 
              :max-count="1" 
              :after-read="afterRead" 
              :before-delete="beforeDeleteImage"
              capture="camera"
              accept="image/*"
              style="display: none;"
            />
          </div>

          <van-cell-group inset title="基本信息">
            <van-field
              v-model="formData.model"
              name="model"
              label="型号"
              placeholder="请输入型号"
              :rules="[{ required: true, message: '请填写型号' }]"
            />
            <van-field
              v-model="formData.alias"
              name="alias"
              label="别称"
              placeholder="请输入别称"
            />
            <van-field
              v-model="formData.colorCode"
              name="colorCode"
              label="颜色"
              placeholder="请输入颜色"
            />
            <van-field
              readonly
              clickable
              name="picker"
              :model-value="currentCustomerName"
              label="客户企业"
              placeholder="点击选择客户"
              @click="showCustomerPicker = true"
            />
          </van-cell-group>

          <van-cell-group inset title="库存价格">
            <van-field
              v-model="formData.stock"
              type="digit"
              name="stock"
              label="库存"
              placeholder="请输入库存"
            />
            <van-field
              v-model="formData.unitPrice"
              type="number"
              name="unitPrice"
              label="单价"
              placeholder="请输入单价"
            />
          </van-cell-group>

          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit" :loading="saving">
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 客户选择器 -->
    <van-popup v-model:show="showCustomerPicker" position="bottom">
      <van-picker
        :columns="customerColumns"
        @confirm="onCustomerConfirm"
        @cancel="showCustomerPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { showToast, showDialog, showImagePreview } from 'vant';
import { useRouter } from 'vue-router';
import { sampleApi } from '@/core/api/sample';
import { customerApi } from '@/core/api/customer';
import { fuzzySearch } from '@/core/utils/pinyin';
import { getImageUrl } from '@/config/env.js';
import { compressImage, blobToFile, SAMPLE_COMPRESSION_OPTIONS } from '@/core/tools/ImageCompressor.js';

const router = useRouter();

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
const searchKeyword = ref('');
const showEditPopup = ref(false);
const showCustomerPicker = ref(false);
const customerOptions = ref([]);
const fileList = ref([]);
const saving = ref(false);
const uploadFile = ref(null);
const uploaderRef = ref(null);
const keepOriginalImage = ref(false);

const searchType = ref('model');
const showSearchTypePopover = ref(false);
const searchTypeActions = [
  { text: '型号', value: 'model' },
  { text: '别称', value: 'alias' },
  { text: '企业', value: 'company' }
];

const showSearchBar = ref(true);
const lastScrollTop = ref(0);

// 表单数据
const formData = reactive({
  id: null,
  model: '',
  alias: '',
  colorCode: '',
  customerId: null,
  stock: 0,
  unitPrice: 0,
  image: ''
});

const customerColumns = computed(() => {
  return customerOptions.value.map(c => ({ text: c.companyName, value: c.id }));
});

const currentCustomerName = computed(() => {
  const customer = customerOptions.value.find(c => c.id === formData.customerId);
  return customer ? customer.companyName : '';
});

const currentSearchTypeLabel = computed(() => {
  const action = searchTypeActions.find(item => item.value === searchType.value);
  return action ? action.text : '型号';
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

// 图片预览
const previewImage = (url) => {
  if (url) {
    showImagePreview({ images: [url], startPosition: 0 });
  }
};

// 方法
const loadCustomers = async () => {
  try {
    const response = await customerApi.list();
    // 过滤掉保留ID
    customerOptions.value = (response.data || []).filter(c => ![1, 2].includes(c.id));
  } catch (error) {
    console.error('加载客户失败');
  }
};

const loadSamples = async () => {
  loading.value = true;
  try {
    const response = await sampleApi.list();
    let allItems = response.data || [];

    // 搜索过滤
    if (searchKeyword.value) {
      const keyword = searchKeyword.value;
      allItems = allItems.filter(item => {
        if (searchType.value === 'model') {
          return fuzzySearch(item.model, keyword);
        }
        if (searchType.value === 'alias') {
          return fuzzySearch(item.alias, keyword);
        }
        if (searchType.value === 'company') {
          return fuzzySearch(item.companyName, keyword);
        }
        return (
          fuzzySearch(item.model, keyword) ||
          fuzzySearch(item.alias, keyword) ||
          fuzzySearch(item.companyName, keyword)
        );
      });
    }

    // 添加版本号防止图片缓存
    list.value = allItems.map(item => ({ ...item, _v: Date.now() }));
  } catch (error) {
    console.error(error);
    showToast('加载失败');
  } finally {
    loading.value = false;
  }
};

const onRefresh = () => {
  loadSamples();
};

const onSearch = () => {
  loadSamples();
};

const onSearchTypeSelect = (action) => {
  searchType.value = action.value;
  showSearchTypePopover.value = false;
  searchKeyword.value = '';
  loadSamples();
};

const onCancelSearch = () => {
  searchKeyword.value = '';
  loadSamples();
};

const getItemImageUrl = (item) => {
  if (!item || !item.image) return '';
  return `${getImageUrl(item.image)}?v=${item._v || ''}`;
};

const addItem = () => {
  Object.assign(formData, {
    id: null,
    model: '',
    alias: '',
    colorCode: '',
    customerId: null,
    stock: 0,
    unitPrice: 0,
    image: ''
  });
  fileList.value = [];
  uploadFile.value = null;
  showEditPopup.value = true;
};

const editItem = async (item) => {
  try {
    const response = await sampleApi.getById(item.id);
    const data = response.data;
    Object.assign(formData, data);
    
    fileList.value = [];
    uploadFile.value = null;
    keepOriginalImage.value = false;
    if (data.image) {
      fileList.value = [{ url: getItemImageUrl(data), isImage: true }];
      keepOriginalImage.value = true; // 标记保留原图
    }
    
    showEditPopup.value = true;
  } catch (error) {
    showToast('获取详情失败');
  }
};

const deleteItem = async (item) => {
  let orderCount = 0;

  try {
    const response = await sampleApi.countOrders(item.id);
    orderCount = response.data || 0;
  } catch (error) {
    showToast('获取样品关联订单失败');
    return;
  }

  const baseMessage =
    `型号：${item.model}\n` +
    `别称：${item.alias || '无'}\n` +
    `颜色：${item.colorCode || '无'}\n` +
    `客户企业：${item.companyName || '无'}\n\n` +
    `关联订单：${orderCount} 个\n\n` +
    `删除后，该样品及其关联订单将被删除，操作不可恢复。`;

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

  if (orderCount > 0) {
    try {
      await showDialog({
        title: '二次确认',
        message: `该样品关联了 ${orderCount} 个订单，所有相关订单将被永久删除，确定继续吗？`,
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
    const response = await sampleApi.remove(item.id);

    if (isApiSuccess(response)) {
      showToast('删除成功');
      loadSamples();
    } else {
      showToast(response && response.message ? response.message : '删除失败');
    }
  } catch (error) {
    showToast('删除失败');
  }
};

const addOrder = (item) => {
  router.push({
    path: '/admin/management/orderManagement', // 或者用户路径，需根据角色判断，这里简化
    query: { sampleId: item.id }
  });
};

const onCustomerConfirm = ({ selectedOptions }) => {
  formData.customerId = selectedOptions[0].value;
  showCustomerPicker.value = false;
};

const afterRead = async (file) => {
  file.status = 'uploading';
  file.message = '处理中...';
  
  try {
    const rawFile = file.file;
    const { blob } = await compressImage(rawFile, SAMPLE_COMPRESSION_OPTIONS);
    uploadFile.value = blobToFile(blob, rawFile.name);
    file.status = 'done';
    file.message = '已完成';
  } catch (error) {
    file.status = 'failed';
    file.message = '失败';
    showToast('图片处理失败');
  }
};

const beforeDeleteImage = () => {
  uploadFile.value = null;
  keepOriginalImage.value = false;
  return true;
};

// 触发上传
const triggerUpload = () => {
  uploaderRef.value?.chooseFile();
};

// 删除图片
const removeImage = () => {
  fileList.value = [];
  uploadFile.value = null;
  keepOriginalImage.value = false;
};

const onSave = async () => {
  saving.value = true;
  try {
    const sampleData = {
      ...formData,
      model: (formData.model || '').trim(),
      alias: (formData.alias || '').trim(),
      colorCode: (formData.colorCode || '').trim()
    };
    // 移除旧的 image 路径，让后端处理
    delete sampleData.image; 
    
    const file = uploadFile.value;
    // 判断是否删除了原有图片: 编辑模式且没有新文件且文件列表为空且没有保留原图标记
    const clearImage = !!formData.id && !file && fileList.value.length === 0 && !keepOriginalImage.value;

    let response;
    if (formData.id) {
      response = await sampleApi.update(
        formData.id, 
        sampleData, 
        file, 
        clearImage ? { clearImage: true } : undefined
      );
    } else {
      response = await sampleApi.create(sampleData, file);
    }
    
    if (isApiSuccess(response)) {
      showToast(formData.id ? '更新成功' : '创建成功');
      showEditPopup.value = false;
      loadSamples();
    } else {
      showToast(response && response.message ? response.message : '保存失败');
    }
  } catch (error) {
    showToast('保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCustomers();
  loadSamples();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.sample-management {
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
  color: #ec4899;
  font-weight: 600;
  background: #fdf2f8;
}

/* 列表区 */
.sample-list-wrapper {
  padding: 0 16px;
}

.list-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.list-empty {
  padding: 40px 0;
}

/* 列表项 */
.sample-item {
  margin-bottom: 12px;
}

.sample-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.sample-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: #fdf2f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sample-thumb-empty {
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
}

.sample-info {
  flex: 1;
  min-width: 0;
  margin-left: 14px;
}

.sample-model {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  word-break: break-word;
}

.sample-company {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  word-break: break-word;
}

.sample-meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.meta-line {
  display: flex;
  align-items: center;
}

.meta-left {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
}

.meta-right {
  display: flex;
  align-items: baseline;
  margin-left: 12px;
}

.metric-label {
  color: #9ca3af;
}

.metric-value {
  display: inline-block;
  width: 8ch;
  margin-left: 2px;
  color: #374151;
}

.stock {
  font-weight: 500;
}

.price {
  color: #ec4899;
  font-weight: 600;
}

.sample-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.sample-card-actions :deep(.van-button) {
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
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
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

.image-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  background: #fff;
  margin-bottom: 12px;
  border-radius: 12px;
  margin: 0 16px 12px;
}

.image-preview-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.image-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-action-buttons :deep(.van-button) {
  min-width: 60px;
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 2px dashed #f9a8d4;
}

.upload-placeholder:active {
  opacity: 0.8;
}

.upload-placeholder-text {
  font-size: 12px;
  color: #9ca3af;
}
</style>
