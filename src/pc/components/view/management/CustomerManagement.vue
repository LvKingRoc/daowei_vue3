<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-input v-model="searchCompanyName" placeholder="根据企业名称搜索" class="search-input" clearable />
      <el-button type="primary" @click="handleSearch" class="action-btn">搜索</el-button>
      <el-button @click="resetSearch" class="action-btn">重置</el-button>
      <el-button type="success" @click="openCustomerDialog" class="action-btn">添加</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="currentPageCustomers" style="width: 100%" stripe border size="small" v-loading="loading"
        :cell-style="{ padding: '12px 8px' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
        @sort-change="handleSortChange">
        <el-table-column prop="companyName" label="企业名称" min-width="120" align="center" sortable="custom" />
        <el-table-column label="联系人信息" min-width="200" align="center">
          <template #default="{ row }">
            <div v-for="(contact, index) in row.contacts" :key="index">
              {{ contact.contactName }} - {{ contact.phone }}
            </div>
            <div v-if="!row.contacts.length">暂无联系人</div>
          </template>
        </el-table-column>
        <el-table-column label="地址" min-width="200" align="center">
          <template #default="{ row }">
            <div v-for="(address, index) in row.addresses" :key="index">
              {{ address.address }}
            </div>
            <div v-if="!row.addresses.length">暂无地址</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="openCustomerDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCustomer(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!currentPageCustomers.length && !loading" class="no-data">无数据</div>
    </div>

    <!-- 分页控件 -->
    <PaginationBar 
      v-model:current-page="currentPage" 
      v-model:page-size="pageSize" 
      :total="totalCount"
      @size-change="handlePageSizeChange" 
    />

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showDialog" width="800px" :close-on-click-modal="false" class="custom-dialog">
      <div class="dialog-title">{{ formData.id ? '编辑客户信息' : '新增客户信息' }}</div>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="0px" label-position="left"
        class="form-container">
        <!-- 基本信息 -->
        <div class="section-title">基本信息</div>
        <div class="form-row">
          <span class="row-label">企业名称：</span>
          <div class="field-content">
            <el-form-item prop="companyName">
              <el-input v-model="formData.companyName" placeholder="请输入企业名称" />
            </el-form-item>
          </div>
        </div>

        <!-- 地址信息 -->
        <div class="section-title">
          地址信息
          <el-button type="primary" link @click="addAddress" class="add-btn">
            <el-icon>
              <Plus />
            </el-icon> 添加地址
          </el-button>
        </div>
        <div v-for="(address, index) in formData.addresses" :key="`address-${index}`" class="form-row">
          <span class="row-label">地址：</span>
          <div class="address-content">
            <el-form-item :prop="`addresses[${index}].address`">
              <el-input v-model="formData.addresses[index].address" placeholder="请输入详细地址（选填）" />
            </el-form-item>
          </div>
          <div class="row-action">
            <el-button v-if="formData.addresses.length > 1" type="danger" link @click="removeAddress(index)"
              class="delete-btn">
              <el-icon>
                <Delete />
              </el-icon> 删除
            </el-button>
          </div>
        </div>

        <!-- 联系人信息 -->
        <div class="section-title">
          联系人信息
          <el-button type="primary" link @click="addContact" class="add-btn">
            <el-icon>
              <Plus />
            </el-icon> 添加联系人
          </el-button>
        </div>
        <div v-for="(contact, index) in formData.contacts" :key="`contact-${index}`" class="form-row">
          <span class="row-label">联系人{{ index + 1 }}：</span>
          <div class="contact-fields">
            <div class="contact-field">
              <span class="field-label">姓名：</span>
              <div class="field-content">
                <el-form-item :prop="`contacts[${index}].contactName`">
                  <el-input v-model="formData.contacts[index].contactName" placeholder="请输入联系人姓名（选填）" />
                </el-form-item>
              </div>
            </div>
            <div class="contact-field">
              <span class="field-label">电话：</span>
              <div class="field-content">
                <el-form-item :prop="`contacts[${index}].phone`" :rules="phoneRules">
                  <el-input v-model="formData.contacts[index].phone" placeholder="11位数字或XXX-XXXXXXX（选填）" />
                </el-form-item>
              </div>
            </div>
          </div>
          <div class="row-action">
            <el-button v-if="formData.contacts.length > 1" type="danger" link @click="removeContact(index)"
              class="delete-btn">
              <el-icon>
                <Delete />
              </el-icon> 删除
            </el-button>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false" class="dialog-btn">取消</el-button>
          <el-button type="primary" @click="validateAndSave" class="dialog-btn">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <ConfirmDeleteDialog
      v-model="showDeleteDialog"
      title="删除客户"
      :message="`确定要删除客户「${deleteItemData.companyName}」吗？`"
      :require-second-confirm="deleteItemData.sampleCount > 0 || deleteItemData.orderCount > 0"
      :related-data="deleteRelatedData"
      :loading="deleteLoading"
      @confirm="executeDelete"
    >
      <template #details>
        <p><strong>企业名称：</strong>{{ deleteItemData.companyName }}</p>
        <p><strong>联系人：</strong>{{ deleteItemData.contactCount }}人</p>
        <p><strong>地址：</strong>{{ deleteItemData.addressCount }}个</p>
      </template>
    </ConfirmDeleteDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import PaginationBar from '@/pc/components/common/PaginationBar.vue';
import ConfirmDeleteDialog from '@/pc/components/common/ConfirmDeleteDialog.vue';
import '@/pc/components/common/management-common.css';
import { getPinyin, getPinyinInitials } from '@/core/utils/pinyin';
import { handleResponse } from '@/core/utils/ResponseHandler';
import { customerApi } from '@/core/api/customer';

// ================================================================================================
// 常量定义
// ================================================================================================

// 系统保留的客户ID，这些客户不会在列表中显示
const RESERVED_IDS = [1, 2];
// 默认每页显示条目数
const DEFAULT_PAGE_SIZE = 10;

// ================================================================================================
// 组件状态
// ================================================================================================

// Vue ref 定义
const formRef = ref(null); // 表单引用
const customers = ref([]); // 原始客户列表
const searchCompanyName = ref(''); // 搜索关键词
const showDialog = ref(false); // 新增/编辑弹窗可见性
const currentPage = ref(1); // 当前页码
const pageSize = ref(DEFAULT_PAGE_SIZE); // 每页条目数
const jumpPage = ref(''); // 跳转页码输入
const loading = ref(false); // 加载状态
const sortState = ref({ column: '', order: '' }); // 排序状态

// 删除流程相关状态
const showDeleteDialog = ref(false); // 删除确认弹窗
const deleteLoading = ref(false); // 删除加载状态
const deleteItemData = ref({ // 待删除客户的关联数据
  id: null,
  companyName: '',
  contactCount: 0,
  addressCount: 0,
  sampleCount: 0,
  orderCount: 0
});

// 删除关联数据（用于二次确认弹窗显示）
const deleteRelatedData = computed(() => {
  const data = [];
  if (deleteItemData.value.sampleCount > 0) {
    data.push({ label: '关联样品', count: deleteItemData.value.sampleCount, unit: '个' });
  }
  if (deleteItemData.value.orderCount > 0) {
    data.push({ label: '关联订单', count: deleteItemData.value.orderCount, unit: '个' });
  }
  return data;
});

// 表单数据
const formData = ref({
  id: null,
  companyName: '',
  addresses: [{ address: '' }],
  contacts: [{ contactName: '', phone: '' }],
});

// ================================================================================================
// 表单验证规则
// ================================================================================================

// 电话号码验证规则
const phoneRules = [
  {
    validator: (rule, value, callback) => {
      if (!value) {
        callback();
      } else if (!/^\d{11}$|^\d{3}-\d{7}$/.test(value)) {
        callback(new Error('电话格式应为11位数字或XXX-XXXXXXX'));
      } else {
        callback();
      }
    },
    trigger: 'blur',
  },
];

// 表单整体验证规则
const rules = {
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 1, max: 50, message: '企业名称长度在1到50个字符', trigger: 'blur' },
  ],
};

// ================================================================================================
// 工具函数
// ================================================================================================

// ================================================================================================
// 计算属性
// ================================================================================================

/**
 * 根据搜索条件和排序状态过滤客户列表
 */
const filteredItems = computed(() => {
  let filtered = customers.value;

  // 根据企业名称进行拼音或模糊搜索
  if (searchCompanyName.value) {
    const searchTerm = searchCompanyName.value.toLowerCase();
    filtered = filtered.filter(item => {
      const companyName = item.companyName || '';
      const companyNameLower = companyName.toLowerCase();
      // 支持中文、全拼、首字母搜索
      const companyNamePinyin = getPinyin(companyName).toLowerCase();
      const companyNameInitials = getPinyinInitials(companyName).toLowerCase();

      return companyNameLower.includes(searchTerm) ||
        companyNamePinyin.includes(searchTerm) ||
        companyNameInitials.includes(searchTerm);
    });
  }

  // 应用排序
  if (sortState.value.column && sortState.value.order) {
    const { column, order } = sortState.value;
    filtered = [...filtered].sort((a, b) => {
      const valueA = String(a[column] || '');
      const valueB = String(b[column] || '');
      // 使用 localeCompare 进行字符串排序，更健壮
      return order === 'ascending'
        ? valueA.localeCompare(valueB, 'zh-CN')
        : valueB.localeCompare(valueA, 'zh-CN');
    });
  }

  return filtered;
});

/**
 * 计算当前页应显示的客户数据
 */
const currentPageCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredItems.value.slice(start, start + pageSize.value);
});

/**
 * 计算过滤后的总客户数
 */
const totalCount = computed(() => filteredItems.value.length);

// ================================================================================================
// 事件处理
// ================================================================================================

/**
 * 处理表格排序变化
 * @param {object} { prop, order } - 排序字段和顺序
 */
const handleSortChange = ({ prop, order }) => {
  sortState.value = { column: prop, order: order || '' };
};

/**
 * 加载客户列表
 */
const loadCustomers = async () => {
  try {
    loading.value = true;
    const response = await customerApi.list();
    const customerData = response.data || [];
    // 过滤掉系统保留的客户
    customers.value = customerData.filter(c => !RESERVED_IDS.includes(c.id));
  } catch (error) {
    ElMessage.error('加载客户列表失败');
    customers.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 执行搜索，重置分页
 */
const handleSearch = () => {
  currentPage.value = 1;
  jumpPage.value = '';
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  searchCompanyName.value = '';
  currentPage.value = 1;
  jumpPage.value = '';
};

/**
 * 处理分页大小变更
 * @param {number} newSize - 新的每页条目数
 */
const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1; // 回到第一页
};

/**
 * 处理当前页码变更
 * @param {number} newPage - 新的页码
 */
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
};

/**
 * 跳转到指定页面
 */
const handleJumpPage = () => {
  if (!jumpPage.value) return;
  const page = parseInt(jumpPage.value);
  const maxPage = Math.ceil(totalCount.value / pageSize.value) || 1;
  if (isNaN(page) || page < 1 || page > maxPage) {
    ElMessage.error(`请输入1到${maxPage}之间的页码`);
    return;
  }
  currentPage.value = page;
  jumpPage.value = '';
};

/**
 * 打开新增/编辑客户弹窗
 * @param {object | null} customer - 客户数据，为 null 表示新增
 */
const openCustomerDialog = async (customer = null) => {
  if (customer && customer.id) {
    // 编辑模式
    try {
      const response = await customerApi.getById(customer.id);
      const customerData = response.data;
      formData.value = {
        id: customerData.id,
        companyName: customerData.companyName,
        addresses: customerData.addresses?.length ? customerData.addresses : [{ address: '' }],
        contacts: customerData.contacts?.length ? customerData.contacts : [{ contactName: '', phone: '' }]
      };
      showDialog.value = true;
    } catch (error) {
      ElMessage.error('获取客户详情失败');
    }
  } else {
    // 新增模式
    formData.value = {
      id: null,
      companyName: '',
      addresses: [{ address: '' }],
      contacts: [{ contactName: '', phone: '' }],
    };
    showDialog.value = true;
  }
};


/**
 * 初始化删除流程，获取关联数据
 * @param {object} customer - 要删除的客户
 */
const deleteCustomer = async (customer) => {
  try {
    // 并发获取关联的样品和订单数量
    const [sampleResponse, orderResponse] = await Promise.all([
      customerApi.countSamples(customer.id),
      customerApi.countOrders(customer.id)
    ]);
    
    const sampleCount = sampleResponse.data || 0;
    const orderCount = orderResponse.data || 0;

    deleteItemData.value = {
      id: customer.id,
      companyName: customer.companyName,
      contactCount: customer.contacts?.length || 0,
      addressCount: customer.addresses?.length || 0,
      sampleCount: sampleCount,
      orderCount: orderCount
    };

    showDeleteDialog.value = true;
  } catch (error) {
    ElMessage.error('获取客户关联数据失败');
  }
};

/**
 * 最终执行删除操作
 */
const executeDelete = async () => {
  deleteLoading.value = true;
  try {
    const response = await customerApi.remove(deleteItemData.value.id);
    const result = handleResponse(response, {
      showSuccessMessage: true
    });

    if (result.success) {
      showDeleteDialog.value = false;
      await loadCustomers(); // 重新加载数据
    }
  } catch (error) {
    if (error && error.success === false) {
      handleResponse(error);
    } else {
      handleResponse({ success: false, message: '操作失败，请检查网络' });
    }
  } finally {
    deleteLoading.value = false;
  }
};


// ================================================================================================
// 表单内操作
// ================================================================================================

/**
 * 添加一个地址输入框
 */
const addAddress = () => {
  formData.value.addresses.push({ address: '' });
};

/**
 * 移除一个地址输入框
 * @param {number} index - 地址索引
 */
const removeAddress = (index) => {
  if (formData.value.addresses.length > 1) {
    formData.value.addresses.splice(index, 1);
  } else {
    // 如果是最后一个，则清空内容而不是移除输入框
    formData.value.addresses[0].address = '';
  }
};

/**
 * 添加一个联系人输入框
 */
const addContact = () => {
  formData.value.contacts.push({ contactName: '', phone: '' });
};

/**
 * 移除一个联系人输入框
 * @param {number} index - 联系人索引
 */
const removeContact = (index) => {
  if (formData.value.contacts.length > 1) {
    formData.value.contacts.splice(index, 1);
  } else {
    // 如果是最后一个，则清空内容
    formData.value.contacts[0] = { contactName: '', phone: '' };
  }
};

/**
 * 验证表单并保存数据
 */
const validateAndSave = async () => {
  try {
    // 首先触发表单验证
    await formRef.value.validate();
    
    // 清理空的地址和联系人条目
    const addresses = formData.value.addresses.filter(a => a.address.trim());
    const contacts = formData.value.contacts.filter(c => c.contactName.trim() || c.phone.trim());
    
    // 准备提交的数据
    const data = {
      companyName: formData.value.companyName,
      // 如果没有有效地址/联系人，提交一个空对象数组，符合后端预期
      addresses: addresses.length ? addresses : [{ address: '' }],
      contacts: contacts.length ? contacts : [{ contactName: '', phone: '' }]
    };

    const isUpdate = !!formData.value.id;
    let response;
    if (isUpdate) {
      response = await customerApi.update(formData.value.id, data);
    } else {
      response = await customerApi.create(data);
    }

    const result = handleResponse(response, {
      showSuccessMessage: true
    });

    if (result.success) {
      showDialog.value = false;
      await loadCustomers();
    }
  } catch (error) {
    // 捕获验证失败或请求失败的错误
    if (error && error.success === false) {
      handleResponse(error);
    } 
    // `validate` ails will also be caught here. The default message is sufficient.
  }
};

// ================================================================================================
// 生命周期钩子
// ================================================================================================

/**
 * 组件挂载时加载初始数据
 */
onMounted(() => {
  loadCustomers();
});
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f7fa;
  width: 100%;
  position: relative;
  min-width: 0;
  margin-left: 0;
  box-sizing: border-box;
  overflow-x: auto;
  max-width: 100%;
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

.no-data {
  text-align: center;
  color: #999;
  margin: 20px 0;
}

.custom-dialog :deep(.el-dialog__header) {
  display: none;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  padding: 20px 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin: 12px 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-btn {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  height: auto;
}

.add-btn :deep(.el-icon) {
  font-size: 14px;
}

.delete-btn {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  height: 32px;
  color: #f56c6c;
  line-height: 1;
}

.delete-btn :deep(.el-icon) {
  font-size: 14px;
}

.delete-btn:hover {
  color: #f78989;
}

.dialog-footer {
  border-top: 1px solid #ebeef5;
  padding: 16px 16px;
  text-align: right;
}

.dialog-btn {
  min-width: 80px;
  padding: 8px 20px;
}

.form-container {
  padding: 0 16px;
}

.form-container :deep(.el-form-item) {
  margin-bottom: 8px;
  width: 100%;
}

.form-container :deep(.el-form-item__content) {
  width: 100%;
  margin-left: 0 !important;
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

.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.row-label {
  width: 80px;
  font-weight: 500;
  color: #606266;
  flex-shrink: 0;
  font-size: 14px;
  line-height: 32px;
  text-align: right;
}

.field-label {
  width: 50px;
  font-weight: 500;
  color: #606266;
  flex-shrink: 0;
  font-size: 14px;
  line-height: 32px;
  text-align: right;
}

.row-action {
  width: 60px;
  text-align: right;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 32px;
}

.contact-fields {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.contact-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.field-content {
  flex: 1;
  min-width: 0;
}

.field-content .el-input {
  width: 100%;
}

.field-content .el-form-item {
  margin-bottom: 0;
}

.address-content {
  flex: 1;
  min-width: 0;
}

.address-content .el-input {
  width: 100%;
}

.address-content .el-form-item {
  margin-bottom: 0;
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

  .customer-info {
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

      .highlight {
        color: #e6a23c;
        font-weight: bold;
      }

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
</style>