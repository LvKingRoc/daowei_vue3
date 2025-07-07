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
            {{ row.alias || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="colorCode" label="颜色" min-width="100" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.colorCode || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="companyName" label="客户企业" min-width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.companyName || '无' }}
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
    <div class="pagination-container">
      <span class="pagination-text">总数：{{ total }}条数据</span>
      <el-select v-model="tableState.pageSize" class="page-size-select" @change="handlePageSizeChange">
        <el-option v-for="size in [10, 20, 50, 100]" :key="size" :label="`${size}条/页`" :value="size" />
      </el-select>
      <el-pagination v-model:current-page="tableState.currentPage" :page-size="tableState.pageSize" :total="total" layout="pager"
        :pager-count="5" class="custom-pager" @current-change="handleCurrentChange" />
      <span class="pagination-text">去到</span>
      <el-input v-model.number="tableState.jumpPage" class="page-jumper" placeholder="页码" type="number" :min="1"
        :max="Math.ceil(total / tableState.pageSize)" @keyup.enter="handleJumpPage" />
      <span class="pagination-text">页</span>
      <el-button type="primary" class="go-btn" @click="handleJumpPage">Go</el-button>
    </div>

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
    <el-dialog v-model="deleteDialogState.visible" title="删除确认" width="500px" :close-on-click-modal="false">
      <div class="delete-warning-content">
        <div class="warning-title">
          <i class="el-icon-warning" style="color: #e6a23c; margin-right: 10px;"></i>
          <span style="margin-left: 10px;">确认删除以下样品？</span>
        </div>
        <div class="sample-info">
          <div class="info-item"><span class="label">型号：</span>{{ deleteDialogState.data.model }}</div>
          <div class="info-item"><span class="label">别称：</span>{{ deleteDialogState.data.alias || '无' }}</div>
          <div class="info-item"><span class="label">颜色：</span>{{ deleteDialogState.data.colorCode || '无' }}</div>
          <div class="info-item"><span class="label">客户企业：</span>{{ deleteDialogState.data.companyName || '无' }}</div>
        </div>
        <div class="warning-details">
          <div class="warning-title-sub">删除后将会同时删除：</div>
          <div class="warning-item">
            <i class="el-icon-document-delete"></i>
            <span>所有关联的订单数据（<span style="color: #f56c6c">{{ deleteDialogState.data.orderCount }}个关联订单</span>）</span>
          </div>
        </div>
        <div class="warning-footer">
          此操作不可恢复，请谨慎操作！
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteDialogState.visible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 二次确认弹窗 -->
    <el-dialog v-model="deleteDialogState.secondConfirmVisible" title="二次确认" width="400px" :close-on-click-modal="false" center>
      <div class="second-confirm-content">
        <div class="icon-warning">
          <i class="el-icon-warning"></i>
        </div>
        <div class="warning-message">
          <div class="title">重要提醒！</div>
          <div class="detail">该样品关联了 <span style="color: #f56c6c">{{ deleteDialogState.data.orderCount }}</span> 个订单</div>
          <div class="detail">删除后，所有相关订单将被<span class="danger">永久删除！不可补救！</span></div>
          <div class="sub-detail">深思！不可补救！您确定要继续吗？</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteDialogState.secondConfirmVisible = false">返回</el-button>
        <el-button type="danger" @click="executeDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Picture } from '@element-plus/icons-vue';
import request from '@/core/utils/request.js';
import pinyin from 'pinyin';
import { getImageUrl as getBaseImageUrl } from '@/config/env.js';
import { useRouter, useRoute } from 'vue-router';
import { compressImage, validateImageFile, blobToFile } from '@/core/tools/ImageCompressor.js';

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
  secondConfirmVisible: false,
  data: {
    id: null,
    model: '',
    alias: '',
    colorCode: '',
    companyName: '',
    orderCount: 0,
  },
});

// 企业选项
const customerOptions = ref([]);

// 表单验证规则
const rules = {
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择企业', trigger: 'change' }]
};


// --- 核心逻辑 ---

/**
 * 拼音搜索工具函数
 * @param {string} text - 需要转换的文本
 * @returns {string} 转换后的全拼
 */
const getPinyin = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('');
};

/**
 * 获取拼音首字母
 * @param {string} text - 需要转换的文本
 * @returns {string} 转换后的拼音首字母
 */
const getPinyinInitials = (text) => {
  if (!text) return '';
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('');
};


// --- 计算属性 ---

/**
 * 根据搜索条件和排序状态过滤和排序样品列表
 */
const filteredItems = computed(() => {
  let filtered = [...tableState.items];

  // 搜索过滤函数
  const matchesSearch = (text, searchTerm) => {
    if (text == null || searchTerm === '') return false;
    const textStr = String(text).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    // 支持拼音全拼和首字母搜索
    const textPinyin = getPinyin(String(text)).toLowerCase();
    const textInitials = getPinyinInitials(String(text)).toLowerCase();
    
    return textStr.includes(searchLower) || 
           textPinyin.includes(searchLower) || 
           textInitials.includes(searchLower);
  };

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
    const response = await request.get('/customers');
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
    const response = await request.get('/samples');
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
    const fixResponse = await request.post('/samples/fix-null-customers');
    const fixedCount = fixResponse.data || 0;
    if (fixedCount > 0) {
      ElMessage.success(`自动修复了 ${fixedCount} 个样品的企业关联`);
      // 重新加载以获取最新数据
      const reloadResponse = await request.get('/samples');
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
    const response = await request.get(`/samples/${item.id}`);
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
    path: '/user/management/orderManagement',
    query: { sampleId: row.id }
  });
};

/**
 * 点击"删除"按钮
 * @param {object} row - 要删除的样品数据
 */
const deleteItem = async (row) => {
  try {
    const response = await request.get(`/samples/${row.id}/orders/count`);
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
 * 确认删除，如果有关联订单则显示二次确认
 */
const confirmDelete = () => {
  deleteDialogState.visible = false;
  if (deleteDialogState.data.orderCount > 0) {
    deleteDialogState.secondConfirmVisible = true;
  } else {
    executeDelete();
  }
};

/**
 * 执行删除操作
 */
const executeDelete = async () => {
  try {
    const { id } = deleteDialogState.data;
    await request.delete(`/samples/${id}`);
    ElMessage.success('删除成功');
    
    deleteDialogState.visible = false;
    deleteDialogState.secondConfirmVisible = false;
    
    await loadItems();
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '删除失败');
  }
};

/**
 * 处理图片上传控件的变化
 * @param {object} uploadInfo - el-upload 返回的文件信息
 */
const handleImageChange = async (uploadInfo) => {
  const file = uploadInfo?.raw;
  if (!file) return;

  const validation = validateImageFile(file);
  if (!validation.valid) {
    ElMessage.error(validation.message);
    return;
  }
  
  try {
    // 自动压缩超过250KB的图片
    if (file.size > 250 * 1024) {
      const { blob, compressionInfo: info } = await compressImage(file);
      dialogState.uploadFile = blobToFile(blob, file.name);
      dialogState.imagePreview = URL.createObjectURL(blob);
      dialogState.compressionInfo = info;
    } else {
      dialogState.uploadFile = file;
      dialogState.imagePreview = URL.createObjectURL(file);
      dialogState.compressionInfo = {
        show: true,
        originalSize: Math.round(file.size / 1024),
        compressedSize: Math.round(file.size / 1024),
        ratio: 0,
      };
    }
  } catch (error) {
    ElMessage.error('图片处理失败，请重试');
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
  const form = new FormData();
  
  // 准备样品数据
  const sampleData = { ...dialogState.formData };
  delete sampleData.image; // 从JSON中移除旧的image路径
  form.append('sample', JSON.stringify(sampleData));

  // 处理图片文件
  if (dialogState.uploadFile) {
    form.append('image', dialogState.uploadFile, dialogState.uploadFile.name || 'image.jpg');
  } else if (!dialogState.imagePreview && dialogState.formData.id) {
    // 如果是编辑状态且图片被移除，则发送一个空信号以删除服务器图片
    form.append('image', new Blob([], { type: 'application/octet-stream' }), 'empty.bin');
  }

  try {
    const { id } = dialogState.formData;
    if (id) {
      // 更新样品
      await request.put(`/samples/${id}`, form, { headers: { 'Content-Type': undefined } });
      ElMessage.success('更新成功');
    } else {
      // 创建新样品
      await request.post('/samples', form, { headers: { 'Content-Type': undefined } });
      ElMessage.success('创建成功');
    }

    dialogState.visible = false;
    await loadItems(); // 重新加载列表以显示最新数据
  } catch(e) {
     ElMessage.error(e.response?.data?.message || '保存失败，请检查数据');
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
    if (newPath === '/user/management/SampleManagement') {
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

.pagination-container {
  position: fixed;
  left: 220px;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  padding: 12px 20px;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  z-index: 999;
}

.pagination-text {
  font-size: 14px;
  color: #606266;
}

.page-size-select {
  width: 120px;
}

.page-jumper {
  width: 80px;
}

.go-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
  border-radius: 4px;
}

.custom-pager :deep(.el-pager li.is-active) {
  background-color: #409eff;
  color: #fff;
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