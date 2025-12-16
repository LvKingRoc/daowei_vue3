<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-input v-model="searchState.model" placeholder="根据型号搜索" class="search-input" clearable />
      <el-input v-model="searchState.alias" placeholder="根据别称搜索" class="search-input" clearable />
      <el-input v-model="searchState.companyName" placeholder="根据客户企业搜索" class="search-input" clearable />
      <el-button type="primary" @click="handleSearch" class="action-btn">搜索</el-button>
      <el-button @click="resetSearch" class="action-btn">重置</el-button>
      <el-button type="success" @click="addItem" class="action-btn">添加</el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table :data="currentPageItems" style="width: 100%" stripe border size="small" v-loading="tableState.loading"
        :cell-style="{ padding: '12px 8px' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
        @sort-change="handleSortChange">
        <el-table-column prop="model" label="型号" min-width="120" align="center" sortable="custom" />
        <el-table-column prop="alias" label="别称" min-width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.alias || '无别称' }}
          </template>
        </el-table-column>
        <el-table-column prop="colorCode" label="颜色" min-width="100" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.colorCode || '无颜色' }}
          </template>
        </el-table-column>
        <el-table-column prop="companyName" label="客户企业" min-width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.companyName || '无客户' }}
          </template>
        </el-table-column>
        <el-table-column label="图片" min-width="120" align="center">
          <template #default="{ row }">
            <div class="image-container">
              <el-image v-if="row.image" style="width: 80px; height: 80px" :src="getItemImageUrl(row)"
                :preview-src-list="[getItemImageUrl(row)]" fit="cover" hide-on-click-modal lazy
                :preview-teleported="true" :initial-index="0" class="sample-image"
                :data-sample-id="row.id">
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
                <span>无图片</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" min-width="100" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.stock ?? '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价(元)" min-width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.unitPrice != null ? row.unitPrice.toFixed(2) : '无' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="editItem(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
            <el-button size="small" type="primary" @click="addOrder(row)">添加订单</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <PaginationBar 
      v-model:current-page="tableState.currentPage" 
      v-model:page-size="tableState.pageSize" 
      :total="total"
      @size-change="handlePageSizeChange" 
    />

    <!-- 编辑/新增弹窗 -->
    <el-dialog v-model="dialogState.visible" width="800px" :close-on-click-modal="false" class="custom-dialog">
      <div class="dialog-title">{{ dialogState.formData.id ? '编辑样品信息' : '新增样品信息' }}</div>
      <el-form 
        :model="dialogState.formData" 
        :rules="rules" 
        :ref="el => dialogState.formRef = el" 
        label-width="110px" 
        label-position="left"
        class="form-container">
        <!-- 基本信息 -->
        <div class="section-title">基本信息</div>
        <el-form-item label="型号：" prop="model">
          <el-input v-model="dialogState.formData.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="别称：">
          <el-input v-model="dialogState.formData.alias" placeholder="请输入别称" />
        </el-form-item>
        <el-form-item label="客户企业：" prop="customerId">
          <el-select v-model="dialogState.formData.customerId" placeholder="请选择企业" clearable filterable style="width: 100%">
            <el-option v-for="customer in customerOptions" :key="customer.id" :label="customer.label" :value="customer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色：">
          <el-input v-model="dialogState.formData.colorCode" placeholder="请输入色号" />
        </el-form-item>

        <!-- 库存和价格信息 -->
        <div class="section-title">库存和价格</div>
        <el-form-item label="库存：">
          <el-input-number v-model="dialogState.formData.stock" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价(元)：">
          <el-input-number v-model="dialogState.formData.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <!-- 商品图片 -->
        <div class="section-title">商品图片</div>
        <el-form-item label="图片：">
          <div class="image-upload-wrapper">
            <el-upload 
              class="avatar-uploader" 
              action="#" 
              :show-file-list="false" 
              :auto-upload="false"
              :http-request="() => {}" 
              :on-change="handleImageChange" 
              accept="image/*"
              :multiple="false">
              <div v-if="dialogState.imagePreview" class="avatar-preview-wrapper">
                <img :src="dialogState.imagePreview" class="avatar" />
              </div>
              <div v-else class="el-upload">
                <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
              </div>
            </el-upload>
            <div class="upload-tip">建议尺寸 300x300，大小不超过15MB</div>
            <div v-if="dialogState.compressionInfo.show" class="compression-info">
              <span>原大小: {{ dialogState.compressionInfo.originalSize }}KB</span>
              <span style="margin: 0 8px;">压缩后: {{ dialogState.compressionInfo.compressedSize }}KB</span>
              <span>压缩率: {{ dialogState.compressionInfo.ratio }}%</span>
            </div>
            <el-button v-if="dialogState.imagePreview" type="danger" size="small" @click="removeImage" class="remove-btn">
              移除图片
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogState.visible = false" class="dialog-btn">取消</el-button>
          <el-button type="primary" @click="validateAndSave" class="dialog-btn">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <ConfirmDeleteDialog
      v-model="deleteDialogState.visible"
      title="删除样品"
      :message="`确定要删除样品「${deleteDialogState.data.model}」吗？`"
      :require-second-confirm="deleteDialogState.data.orderCount > 0"
      :related-data="deleteRelatedData"
      :loading="deleteDialogState.loading"
      @confirm="executeDelete"
    >
      <template #details>
        <p><strong>型号：</strong>{{ deleteDialogState.data.model }}</p>
        <p><strong>别称：</strong>{{ deleteDialogState.data.alias || '无' }}</p>
        <p><strong>颜色：</strong>{{ deleteDialogState.data.colorCode || '无' }}</p>
        <p><strong>客户企业：</strong>{{ deleteDialogState.data.companyName || '无' }}</p>
      </template>
    </ConfirmDeleteDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import PaginationBar from '@/pc/components/common/PaginationBar.vue';
import ConfirmDeleteDialog from '@/pc/components/common/ConfirmDeleteDialog.vue';
import '@/pc/components/common/management-common.css';
import { handleResponse, handleError } from '@/core/utils/ResponseHandler';
import { Plus, Picture } from '@element-plus/icons-vue';
import { sampleApi } from '@/core/api/sample';
import { customerApi } from '@/core/api/customer';
import { matchesSearch } from '@/core/utils/pinyin';
import { getImageUrl as getBaseImageUrl } from '@/config/env.js';
import { useRouter, useRoute } from 'vue-router';
// 确保只导入需要的函数和常量
import { compressImage, validateImageFile, blobToFile, SAMPLE_COMPRESSION_OPTIONS } from '@/core/tools/ImageCompressor.js';

const router = useRouter();
const route = useRoute();

// --- 状态管理 ---

// 搜索和排序状态
const searchState = reactive({
  model: '',
  alias: '',
  companyName: '',
});

const sortState = reactive({
  column: '',
  order: '',
});

// 表格和分页状态
const tableState = reactive({
  loading: false,
  items: [], // 原始样品列表
  currentPage: 1,
  pageSize: 10,
  jumpPage: '',
});

// 默认表单数据生成器
const getDefaultFormData = () => ({
  id: null,
  customerId: 2, // 默认"无"客户
  alias: '',
  model: '',
  colorCode: '',
  stock: 0,
  unitPrice: 0,
  image: null,
});

// 编辑/新增弹窗状态
const dialogState = reactive({
  visible: false,
  formRef: null,
  formData: getDefaultFormData(),
  imagePreview: '', // 图片预览URL
  uploadFile: null, // 待上传的文件
  compressionInfo: {
    show: false,
    originalSize: 0,
    compressedSize: 0,
    ratio: 0,
  },
});

// 删除确认弹窗状态
const deleteDialogState = reactive({
  visible: false,
  loading: false,
  data: {
    id: null,
    model: '',
    alias: '',
    colorCode: '',
    companyName: '',
    orderCount: 0,
  },
});

// 删除关联数据（用于二次确认弹窗）
const deleteRelatedData = computed(() => {
  const data = [];
  if (deleteDialogState.data.orderCount > 0) {
    data.push({ label: '关联订单', count: deleteDialogState.data.orderCount, unit: '个' });
  }
  return data;
});

// 企业选项
const customerOptions = ref([]);

// 表单验证规则
const rules = {
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择企业', trigger: 'change' }]
};


// --- 核心逻辑 ---

// --- 计算属性 ---

/**
 * 根据搜索条件和排序状态过滤和排序样品列表
 */
const filteredItems = computed(() => {
  let filtered = [...tableState.items];

  // 应用搜索过滤
  if (searchState.model) {
    filtered = filtered.filter(item => matchesSearch(item.model, searchState.model));
  }
  if (searchState.alias) {
    filtered = filtered.filter(item => matchesSearch(item.alias, searchState.alias));
  }
  if (searchState.companyName) {
    filtered = filtered.filter(item => matchesSearch(item.companyName, searchState.companyName));
  }

  // 应用排序
  if (sortState.column && sortState.order) {
    const { column, order } = sortState;
    filtered.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      
      if (order === 'ascending') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }

  return filtered;
});

/**
 * 当前页显示的样品数据
 */
const currentPageItems = computed(() => {
  const start = (tableState.currentPage - 1) * tableState.pageSize;
  const end = start + tableState.pageSize;
  return filteredItems.value.slice(start, end);
});

/**
 * 总数据条数
 */
const total = computed(() => filteredItems.value.length);


// --- 数据加载 ---

/**
 * 加载客户企业列表
 */
const loadCustomerOptions = async () => {
  try {
    const response = await customerApi.list();
    customerOptions.value = (response.data || []).map(customer => ({
      id: customer.id,
      label: customer.companyName,
    }));
  } catch (error) {
    ElMessage.error('加载企业列表失败');
  }
};

/**
 * 加载样品列表
 */
const loadItems = async () => {
  try {
    tableState.loading = true;
    const response = await sampleApi.list();
    // 为每个项目添加一个缓存版本号，用于强制刷新图片
    tableState.items = (response.data || []).map(item => ({ ...item, _v: Date.now() }));

    // 自动修复 customerId 为 null 的数据
    if (tableState.items.some(item => item.customerId === null)) {
      await fixNullCustomers();
    }
  } catch (error) {
    ElMessage.error('加载样品列表失败');
  } finally {
    tableState.loading = false;
  }
};

/**
 * 修复 customerId 为 null 的样品数据
 */
const fixNullCustomers = async () => {
  try {
    const fixResponse = await sampleApi.fixNullCustomers();
    const fixedCount = fixResponse.data || 0;
    if (fixedCount > 0) {
      ElMessage.success(`自动修复了 ${fixedCount} 个样品的企业关联`);
      // 重新加载以获取最新数据
      const reloadResponse = await sampleApi.list();
      tableState.items = (reloadResponse.data || []).map(item => ({ ...item, _v: Date.now() }));
    }
  } catch (fixError) {
    console.warn('修复样品企业关联失败:', fixError);
  }
};


// --- 事件处理 ---

/**
 * 处理排序变化
 */
const handleSortChange = ({ prop, order }) => {
  sortState.column = prop;
  sortState.order = order || '';
};

/**
 * 执行搜索
 */
const handleSearch = () => {
  tableState.currentPage = 1;
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  searchState.model = '';
  searchState.alias = '';
  searchState.companyName = '';
  tableState.currentPage = 1;
};

/**
 * 处理分页大小变化
 */
const handlePageSizeChange = (newSize) => {
  tableState.pageSize = newSize;
  tableState.currentPage = 1;
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (newPage) => {
  tableState.currentPage = newPage;
};

/**
 * 跳转到指定页
 */
const handleJumpPage = () => {
  const page = Number(tableState.jumpPage);
  if (!page) return;
  const maxPage = Math.ceil(total.value / tableState.pageSize);
  if (page < 1 || page > maxPage) {
    ElMessage.error(`请输入1到${maxPage}之间的页码`);
    return;
  }
  tableState.currentPage = page;
  tableState.jumpPage = '';
};


// --- CRUD 操作 ---

/**
 * 重置弹窗内表单的状态
 */
const resetDialogState = () => {
  dialogState.formData = getDefaultFormData();
  dialogState.imagePreview = '';
  dialogState.uploadFile = null;
  dialogState.compressionInfo = { show: false, originalSize: 0, compressedSize: 0, ratio: 0 };
};

/**
 * 点击"添加"按钮
 */
const addItem = () => {
  resetDialogState();
  dialogState.visible = true;
};

/**
 * 点击"编辑"按钮
 * @param {object} item - 要编辑的样品数据
 */
const editItem = async (item) => {
  try {
    resetDialogState();
    const response = await sampleApi.getById(item.id);
    dialogState.formData = response.data;
    if (dialogState.formData.image) {
      dialogState.imagePreview = getItemImageUrl(dialogState.formData);
    }
    dialogState.visible = true;
  } catch (error) {
    ElMessage.error('获取样品详情失败');
  }
};

/**
 * 点击"添加订单"按钮
 * @param {object} row - 样品行数据
 */
const addOrder = (row) => {
  router.push({
    path: '/admin/management/orderManagement',
    query: { sampleId: row.id }
  });
};

/**
 * 点击"删除"按钮
 * @param {object} row - 要删除的样品数据
 */
const deleteItem = async (row) => {
  try {
    const response = await sampleApi.countOrders(row.id);
    const orderCount = response.data || 0;

    deleteDialogState.data = {
      id: row.id,
      model: row.model,
      alias: row.alias,
      colorCode: row.colorCode,
      companyName: row.companyName,
      orderCount: orderCount,
    };
    deleteDialogState.visible = true;
  } catch (error) {
    ElMessage.error('检查样品关联订单失败');
  }
};

/**
 * 执行删除操作
 */
const executeDelete = async () => {
  deleteDialogState.loading = true;
  try {
    const { id } = deleteDialogState.data;
    const response = await sampleApi.remove(id);
    const result = handleResponse(response, {
      showSuccessMessage: true
    });
    if (!result.success) return;

    deleteDialogState.visible = false;
    await loadItems();
  } catch (error) {
    const apiResponse = error?.response?.data || { success: false, message: '操作失败，请检查网络' };
    handleResponse(apiResponse);
  } finally {
    deleteDialogState.loading = false;
  }
};

/**
 * 处理图片上传控件的变化
 * @param {object} uploadInfo - el-upload 返回的文件信息
 */
const handleImageChange = async (uploadInfo) => {
  const file = uploadInfo?.raw;
  if (!file) return;

  // 1. 验证文件
  const validation = validateImageFile(file);
  if (!validation.valid) {
    ElMessage.error(validation.message);
    return;
  }
  
  try {
    // 2. 调用核心压缩函数，并传入样品专属配置
    const { blob, compressionInfo } = await compressImage(file, SAMPLE_COMPRESSION_OPTIONS);
    
    // 3. 更新UI状态
    dialogState.uploadFile = blobToFile(blob, file.name);
    dialogState.imagePreview = URL.createObjectURL(blob);
    dialogState.compressionInfo = compressionInfo;
    
    if (compressionInfo.ratio > 0) {
      ElMessage.success(`图片已自动压缩 ${compressionInfo.ratio}%`);
    } else {
      ElMessage.info('图片尺寸合格，无需压缩');
    }
  } catch (error) {
    ElMessage.error(error?.message || '图片处理失败，请重试');
  }
};

/**
 * 移除预览和待上传的图片
 */
const removeImage = () => {
  dialogState.imagePreview = '';
  dialogState.uploadFile = null;
  dialogState.compressionInfo = { show: false, originalSize: 0, compressedSize: 0, ratio: 0 };
};

/**
 * 验证并保存表单
 */
const validateAndSave = async () => {
  try {
    await dialogState.formRef.validate();
    await submitForm();
  } catch (error) {
    // ElMessage.error(error.response?.data?.message || '保存失败，请检查数据');
  }
};

/**
 * 构建并提交表单数据
 */
const submitForm = async () => {
  // 准备样品数据
  const sampleData = { ...dialogState.formData };
  delete sampleData.image; // 从JSON中移除旧的image路径

  const file = dialogState.uploadFile || null;
  const isEditing = !!sampleData.id;
  const clearImage = isEditing && !dialogState.imagePreview && !file;

  try {
    let response;
    if (isEditing) {
      // 更新样品
      response = await sampleApi.update(sampleData.id, sampleData, file, clearImage ? { clearImage: true } : undefined);
    } else {
      // 创建新样品
      response = await sampleApi.create(sampleData, file);
    }

    const result = handleResponse(response, {
      showSuccessMessage: true
    });
    if (!result.success) return;

    dialogState.visible = false;
    await loadItems(); // 重新加载列表以显示最新数据
  } catch (e) {
    const apiResponse = e?.response?.data || { success: false, message: '操作失败，请检查网络' };
    handleResponse(apiResponse);
  }
};


// --- 工具函数 ---

/**
 * 获取带缓存刷新参数的图片URL
 * @param {object} item - 样品对象
 * @returns {string} 最终的图片URL
 */
const getItemImageUrl = (item) => {
  if (!item || !item.image) return '';
  // 通过给URL附加一个动态参数来强制浏览器重新加载图片
  return `${getBaseImageUrl(item.image)}?v=${item._v || ''}`;
};


// --- 生命周期和路由监听 ---

const unwatchRoute = watch(
  () => route.path,
  async (newPath) => {
    // 当从其他页面切换到本页面时，重新加载数据
    if (newPath === '/admin/management/SampleManagement') {
      await loadItems();
    }
  }
);

onMounted(() => {
  loadCustomerOptions();
  loadItems();
});

onBeforeUnmount(() => {
  unwatchRoute(); // 组件卸载时停止监听
});
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f7fa;
  min-width: 0;
  margin-left: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.search-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 200px;
}

.action-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
  border-radius: 4px;
}

.table-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 60px;
  overflow-x: auto;
  min-width: 800px;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.avatar-uploader {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.compression-info {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.remove-btn {
  margin-top: 8px;
}

.form-container {
  background: #fff;
  padding: 20px 0 0 0;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 40px;
  color: #8c939d;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
  font-size: 14px;
  gap: 4px;
}

.no-image {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
  border-radius: 4px;
  gap: 4px;
}

.sample-image {
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.sample-image:hover {
  transform: scale(1.05);
}

/* 删除确认弹窗样式 */
.delete-warning-content {
  .warning-title {
    background-color: #fdf6ec;
    padding: 15px 20px;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #faecd8;

    i {
      margin-right: 0;
    }
  }

  .sample-info {
    padding: 15px 20px;
    background-color: #fff;

    .info-item {
      margin: 8px 0;
      font-size: 14px;

      .label {
        color: #606266;
        margin-right: 10px;
        display: inline-block;
        width: 80px;
        text-align: right;
      }
    }
  }

  .warning-details {
    padding: 15px 20px;
    background-color: #fff8f8;

    .warning-title-sub {
      font-size: 14px;
      font-weight: bold;
      color: #f56c6c;
      margin-bottom: 10px;
    }

    .warning-item {
      margin: 8px 0;
      display: flex;
      align-items: center;
      font-size: 14px;

      i {
        color: #f56c6c;
        margin-right: 10px;
        font-size: 16px;
      }
    }
  }

  .warning-footer {
    padding: 15px 20px;
    background-color: #fff8f8;
    color: #f56c6c;
    font-weight: bold;
    text-align: center;
    border-top: 1px solid #fde2e2;
  }
}

/* 二次确认弹窗样式 */
.second-confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;

  .icon-warning {
    font-size: 48px;
    color: #e6a23c;
    margin-bottom: 20px;
    animation: warning-shake 0.5s ease-in-out;
  }

  .warning-message {
    text-align: center;

    .title {
      font-size: 18px;
      font-weight: bold;
      color: #e6a23c;
      margin-bottom: 15px;
    }

    .detail {
      font-size: 14px;
      margin: 8px 0;
      color: #606266;

      .danger {
        color: #f56c6c;
        font-weight: bold;
      }
    }

    .sub-detail {
      margin-top: 15px;
      font-size: 14px;
      color: #909399;
    }
  }
}

@keyframes warning-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.custom-dialog :deep(.el-dialog__header) {
  display: none;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.custom-dialog {
  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    padding: 20px 16px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 12px;
  }

  .form-container {
    padding: 0 16px;
  }
  
  .form-container :deep(.el-form-item) {
      margin-bottom: 16px;
  }

  .form-container :deep(.el-form-item__content) {
    width: 100%;
  }

  .form-container :deep(.el-input__wrapper),
  .form-container :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
  }

  .form-container :deep(.el-input__wrapper:hover),
  .form-container :deep(.el-textarea__inner:hover) {
    box-shadow: 0 0 0 1px #409eff inset;
  }

  .form-container :deep(.el-form-item.is-error .el-input__wrapper),
  .form-container :deep(.el-form-item.is-error .el-textarea__inner) {
    box-shadow: 0 0 0 1px #f56c6c inset;
  }

  .section-title {
    font-size: 15px;
    font-weight: 500;
    color: #2c3e50;
    margin: 12px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .image-upload-wrapper {
    width: 100%;
  }

  .dialog-footer {
    border-top: 1px solid #ebeef5;
    padding: 16px;
    text-align: right;
  }

  .dialog-btn {
    min-width: 80px;
    padding: 8px 20px;
  }
}
</style>