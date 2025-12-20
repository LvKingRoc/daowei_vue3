<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-input v-model="searchName" placeholder="请输入姓名" class="search-input" clearable />
      <el-button type="primary" @click="handleSearch" class="action-btn">搜索</el-button>
      <el-button @click="resetSearch" class="action-btn">重置</el-button>
      <el-button type="success" @click="showAddDialog" class="action-btn">新增员工</el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table :data="currentPageEmployees" style="width: 100%" stripe border size="small" v-loading="loading"
        :cell-style="{ padding: '12px 8px' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
        @sort-change="handleSortChange">
        <el-table-column prop="name" label="姓名" min-width="100" align="center" sortable="custom" />
        <el-table-column label="性别" min-width="80" align="center" sortable="custom" prop="gender">
          <template #default="{ row }">{{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '无' }}</template>
        </el-table-column>
        <el-table-column label="年龄" min-width="80" align="center" sortable="custom" prop="age">
          <template #default="{ row }">{{ row.idCard ? getAgeFromIdCard(row.idCard) : '无' }}</template>
        </el-table-column>
        <el-table-column label="电话" min-width="120" align="center">
          <template #default="{ row }">{{ row.phone || '无电话' }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="150" align="center">
          <template #default="{ row }">{{ row.email || '无邮箱' }}</template>
        </el-table-column>
        <el-table-column label="身份证" min-width="180" align="center">
          <template #default="{ row }">{{ row.idCard ? formatIdCardDisplay(row.idCard) : '无' }}</template>
        </el-table-column>
        <el-table-column label="入职日期" min-width="120" align="center" sortable="custom" prop="hireDate">
          <template #default="{ row }">{{ row.hireDate ? formatDate(row.hireDate) : '无' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="editEmployee(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteEmployee(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <PaginationBar 
      v-model:current-page="currentPage" 
      v-model:page-size="pageSize" 
      :total="totalEmployees"
      @size-change="handlePageSizeChange" 
    />

    <!-- 新增/编辑弹窗 -->
    <el-config-provider :locale="locale">
      <el-dialog :title="isEditMode ? '编辑员工信息' : '新增员工'" v-model="showDialog" width="600px" :close-on-click-modal="false">
        <el-form ref="employeeForm" :model="formData" :rules="rules" label-width="100px" class="form-with-spacing">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="formData.gender" placeholder="请选择性别">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="formattedIdCard" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="18">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="入职日期">
            <el-date-picker v-model="formData.hireDate" type="date" placeholder="选择日期" style="width: 100%;"
              format="YYYY-MM-DD" value-format="YYYY-MM-DD" :locale="locale" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </template>
      </el-dialog>
    </el-config-provider>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除员工"
      :message="`确定要删除员工「${deleteItemData.name}」吗？`"
      type="danger"
      confirm-text="确定删除"
      :loading="deleteLoading"
      @confirm="executeDelete"
    >
      <template #details>
        <p><strong>姓名：</strong>{{ deleteItemData.name }}</p>
        <p><strong>电话：</strong>{{ deleteItemData.phone || '无' }}</p>
        <p><strong>入职日期：</strong>{{ deleteItemData.hireDate ? formatDate(deleteItemData.hireDate) : '无' }}</p>
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElConfigProvider } from 'element-plus';
import PaginationBar from '@/pc/components/common/PaginationBar.vue';
import ConfirmDialog from '@/pc/components/common/ConfirmDialog.vue';
import '@/pc/components/common/management-common.css';
import { handleResponse, handleError } from '@/core/utils/ResponseHandler';
import dayjs from 'dayjs';
import { getPinyin, getPinyinInitials } from '@/core/utils/pinyin';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { employeeApi } from '@/core/api/employee';
import { saveDraft, getDraft, clearDraft, hasDraft, getDraftInfo } from '@/core/utils/formDraft';
import { ElMessageBox } from 'element-plus';

// 草稿配置
const DRAFT_NAME = 'pc_employee';

// ========== 类型定义 ==========

/**
 * 排序状态接口
 */
/**
 * 员工数据接口
 */
/**
 * 表格排序事件接口
 */
// ========== 响应式状态声明 ==========

const employees = ref([]); // 员工列表
const searchName = ref(''); // 搜索关键字
const showDialog = ref(false); // 控制新增/编辑弹窗的显示
const isEditMode = ref(false); // 标识当前是否为编辑模式
const loading = ref(false); // 表格加载状态
const employeeForm = ref(); // 表单实例引用

// 分页相关状态
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页显示数量
const jumpPage = ref(''); // 跳转页码

// ElementPlus组件中文语言配置
const locale = zhCn;

// 表单数据
const formData = ref({
  id: 0,
  name: '',
  gender: 'male',
  phone: '',
  email: '',
  idCard: '',
  hireDate: '',
});

// 排序状态
const sortState = ref({
  column: '',
  order: ''
});

// 删除相关状态
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const deleteItemData = ref({
  id: 0,
  name: '',
  phone: '',
  hireDate: ''
});

// ========== 工具函数 ==========

/**
 * 格式化日期字符串
 * @param dateStr 日期字符串
 */
const formatDate = (dateStr) => dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '';

/**
 * 格式化身份证号（增加空格，便于阅读）
 * @param idCard 身份证号
 */
const formatIdCardDisplay = (idCard) => {
  if (!idCard) return '';
  const cleanedId = idCard.replace(/\s/g, '');
  if (cleanedId.length === 18) {
    return `${cleanedId.slice(0, 6)} ${cleanedId.slice(6, 14)} ${cleanedId.slice(14, 18)}`;
  }
  return idCard;
};

/**
 * 根据身份证号计算年龄
 * @param idCard 身份证号
 */
const getAgeFromIdCard = (idCard) => {
  if (!idCard || idCard.replace(/\s/g, '').length !== 18) return 0;
  const birthYear = idCard.replace(/\s/g, '').slice(6, 10);
  const currentYear = dayjs().year();
  return currentYear - Number(birthYear);
};

// ========== 计算属性 ==========

/**
 * 计算属性：格式化身份证号输入
 * 用于 v-model 绑定，实现输入时自动去除空格，显示时格式化
 */
const formattedIdCard = computed({
  get: () => formatIdCardDisplay(formData.value.idCard),
  set: (newValue) => {
    formData.value.idCard = newValue.replace(/\s/g, '');
  }
});

/**
 * 计算属性：过滤并排序后的员工数据
 * 1. 根据姓名（支持中文、拼音、首字母）进行搜索过滤
 * 2. 根据用户选择的列进行排序
 */
const filteredEmployees = computed(() => {
  let filtered = employees.value;

  // 根据姓名搜索
  if (searchName.value) {
    const searchTerm = searchName.value.toLowerCase();
    filtered = filtered.filter(emp => {
      const name = emp.name || '';
      const nameLower = name.toLowerCase();
      const namePinyin = getPinyin(name).toLowerCase();
      const nameInitials = getPinyinInitials(name).toLowerCase();

      return nameLower.includes(searchTerm) ||
        namePinyin.includes(searchTerm) ||
        nameInitials.includes(searchTerm);
    });
  }

  // 应用排序
  if (sortState.value.column && sortState.value.order) {
    const { column, order } = sortState.value;
    filtered = [...filtered].sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      // 特殊处理日期和年龄排序
      if (column === 'hireDate') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      } else if (column === 'age') {
        valueA = getAgeFromIdCard(a.idCard || '');
        valueB = getAgeFromIdCard(b.idCard || '');
      } else {
        valueA = String(valueA || '').toLowerCase();
        valueB = String(valueB || '').toLowerCase();
      }

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
 * 计算属性：当前页需要显示的数据
 */
const currentPageEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredEmployees.value.slice(start, end);
});

/**
 * 计算属性：过滤后的总数据量
 */
const totalEmployees = computed(() => filteredEmployees.value.length);


// ========== 表单校验规则 ==========

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号码', trigger: 'blur' }
  ],
  email: [
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  idCard: [
    { pattern: /^\d{17}[\dXx]$/, message: '请输入18位有效身份证号', trigger: 'blur' }
  ]
};

// ========== 事件处理器 ==========

/**
 * 处理表格排序变化
 */
const handleSortChange = ({ prop, order }) => {
  sortState.value = {
    column: prop,
    order: order || ''
  };
};

/**
 * 从服务器加载员工数据
 */
const loadEmployees = async () => {
  loading.value = true;
  try {
    const response = await employeeApi.list();
    // 假设API返回的数据在 response.data 中
    employees.value = response.data || [];
  } catch (error) {
    ElMessage.error(`获取员工列表失败: ${error.message}`);
    employees.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 处理搜索按钮点击
 */
const handleSearch = () => {
  currentPage.value = 1;
};

/**
 * 处理重置搜索
 */
const resetSearch = () => {
  searchName.value = '';
  currentPage.value = 1;
};

/**
 * 处理分页大小变化
 */
const handlePageSizeChange = () => {
  currentPage.value = 1; // 切换每页数量时，返回第一页
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (page) => {
  currentPage.value = page;
};

/**
 * 处理跳转页面
 */
const handleJumpPage = () => {
  const maxPage = Math.ceil(totalEmployees.value / pageSize.value);
  const page = Number(jumpPage.value);
  if (page >= 1 && page <= maxPage) {
    currentPage.value = page;
  }
  jumpPage.value = '';
};

/**
 * 显示新增员工弹窗
 */
const showAddDialog = async () => {
  isEditMode.value = false;
  formData.value = {
    id: 0,
    name: '',
    gender: 'male',
    phone: '',
    email: '',
    idCard: '',
    hireDate: ''
  };
  
  // 检查是否有草稿
  if (hasDraft(DRAFT_NAME, { isEdit: false })) {
    const draftInfo = getDraftInfo(DRAFT_NAME);
    try {
      await ElMessageBox.confirm(
        `${draftInfo?.timeAgo || '之前'}有未保存的内容，是否恢复？`,
        '发现未保存的草稿',
        { confirmButtonText: '恢复草稿', cancelButtonText: '放弃草稿', type: 'info' }
      );
      const draft = getDraft(DRAFT_NAME, { isEdit: false });
      if (draft) {
        formData.value = { ...formData.value, ...draft };
      }
    } catch {
      clearDraft(DRAFT_NAME);
    }
  }
  
  showDialog.value = true;
};

/**
 * 显示编辑员工弹窗
 * @param employee 要编辑的员工对象
 */
const editEmployee = (employee) => {
  isEditMode.value = true;
  formData.value = { ...employee };
  showDialog.value = true;
};

/**
 * 显示删除确认弹窗
 * @param employee 要删除的员工对象
 */
const deleteEmployee = (employee) => {
  deleteItemData.value = {
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    hireDate: employee.hireDate
  };
  showDeleteDialog.value = true;
};

/**
 * 执行删除操作
 */
const executeDelete = async () => {
  deleteLoading.value = true;
  try {
    const response = await employeeApi.remove(deleteItemData.value.id);
    const result = handleResponse(response, {
      showSuccessMessage: true
    });
    if (!result.success) return;

    showDeleteDialog.value = false;
    await loadEmployees();
  } catch (error) {
    const errorResponse = error?.response?.data || { success: false, message: '操作失败，请检查网络' };
    handleResponse(errorResponse);
  } finally {
    deleteLoading.value = false;
  }
};

/**
 * 提交表单（新增或编辑）
 */
const submitForm = async () => {
  if (!employeeForm.value) return;

  try {
    await employeeForm.value.validate(); // 触发表单验证

    // 准备提交的数据
    const submitData = {
      name: formData.value.name,
      gender: formData.value.gender,
      phone: formData.value.phone,
      email: formData.value.email,
      idCard: formData.value.idCard.replace(/\s/g, ''), // 确保提交无空格的身份证号
      hireDate: formData.value.hireDate
    };

    let response;
    if (isEditMode.value) {
      // 编辑模式，发送 PUT 请求
      response = await employeeApi.update(formData.value.id, submitData);
    } else {
      // 新增模式，发送 POST 请求
      response = await employeeApi.create(submitData);
    }

    const result = handleResponse(response, {
      showSuccessMessage: true
    });
    if (!result.success) return;

    clearDraft(DRAFT_NAME);  // 提交成功后清除草稿
    await loadEmployees(); // 成功后刷新列表
    showDialog.value = false; // 关闭弹窗
  } catch (error) {
    // 捕获校验失败或请求失败的错误
    const apiResponse = error?.response?.data;
    if (apiResponse) {
      handleResponse(apiResponse);
    }
    // 如果是校验未通过，ElementPlus 会自动处理提示，这里可不作额外处理
  }
};


// ========== 生命周期钩子 ==========

// 自动保存草稿（仅新增模式）
watch(
  () => ({ ...formData.value }),
  (newData) => {
    if (!newData.id && showDialog.value && !isEditMode.value) {
      saveDraft(DRAFT_NAME, newData, { isEdit: false });
    }
  },
  { deep: true }
);

/**
 * 组件挂载后执行初始化操作
 */
onMounted(() => {
  loadEmployees();
});
</script>

<style scoped>
/* 独立样式，仅供本组件使用 */
.container {
  padding: 20px;
  background-color: #f5f7fa;
  min-width: 0;
  margin-left: 0;
  /* 移除左边距 */
  width: 100%;
  max-width: 100%;
  /* 使用100%宽度 */
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
  /* 增加底部边距，为固定的分页控件留出空间 */
  overflow-x: auto;
  min-width: 800px;
  /* 设置最小宽度，避免内容过度挤压 */
}

.form-with-spacing .el-form-item {
  margin-bottom: 15px;
}
</style>