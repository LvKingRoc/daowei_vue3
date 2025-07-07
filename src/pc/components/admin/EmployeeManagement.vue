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
          <template #default="{ row }">{{ row.phone || '无' }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="150" align="center">
          <template #default="{ row }">{{ row.email || '无' }}</template>
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
    <div class="pagination-container">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="totalEmployees" layout="total, sizes, prev, pager, next, jumper" @size-change="handlePageSizeChange"
        class="custom-pager" />
    </div>

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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, ElConfigProvider } from 'element-plus';
import request from '@/core/utils/request.ts';
import dayjs from 'dayjs';
import pinyin from 'pinyin';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

// ========== 类型定义 ==========

/**
 * 排序状态接口
 */
interface SortState {
  column: string;
  order: string;
}

/**
 * 员工数据接口
 */
interface Employee {
  id: number;
  name: string;
  gender: string;
  phone: string;
  email: string;
  idCard: string;
  hireDate: string;
  [key: string]: any; // 允许索引签名
}

/**
 * 表格排序事件接口
 */
interface SortChangeEvent {
  column: any;
  prop: string;
  order: string;
}

// ========== 响应式状态声明 ==========

const employees = ref<Employee[]>([]); // 员工列表
const searchName = ref(''); // 搜索关键字
const showDialog = ref(false); // 控制新增/编辑弹窗的显示
const isEditMode = ref(false); // 标识当前是否为编辑模式
const loading = ref(false); // 表格加载状态
const employeeForm = ref<FormInstance>(); // 表单实例引用

// 分页相关状态
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页显示数量

// ElementPlus组件中文语言配置
const locale = zhCn;

// 表单数据
const formData = ref<Employee>({
  id: 0,
  name: '',
  gender: 'male',
  phone: '',
  email: '',
  idCard: '',
  hireDate: '',
});

// 排序状态
const sortState = ref<SortState>({
  column: '',
  order: ''
});


// ========== 工具函数 ==========

/**
 * 获取文本的 pinyin 全拼
 * @param text 输入的中文文本
 */
const getPinyin = (text: string) => {
  if (!text) return '';
  return pinyin(text, {
    style: pinyin.STYLE_NORMAL,
  }).flat().join('');
};

/**
 * 获取文本的 pinyin 首字母
 * @param text 输入的中文文本
 */
const getPinyinInitials = (text: string) => {
  if (!text) return '';
  return pinyin(text, {
    style: pinyin.STYLE_FIRST_LETTER,
  }).flat().join('');
};

/**
 * 格式化日期字符串
 * @param dateStr 日期字符串
 */
const formatDate = (dateStr: string) => dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '';

/**
 * 格式化身份证号（增加空格，便于阅读）
 * @param idCard 身份证号
 */
const formatIdCardDisplay = (idCard: string): string => {
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
const getAgeFromIdCard = (idCard: string): number => {
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
    filtered = [...filtered].sort((a: Employee, b: Employee) => {
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

const rules: FormRules = {
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
const handleSortChange = ({ prop, order }: SortChangeEvent) => {
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
    const response = await request.get('/employees');
    // 假设API返回的数据在 response.data 中
    employees.value = response.data || [];
  } catch (error: any) {
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
 * 显示新增员工弹窗
 */
const showAddDialog = () => {
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
  showDialog.value = true;
};

/**
 * 显示编辑员工弹窗
 * @param employee 要编辑的员工对象
 */
const editEmployee = (employee: Employee) => {
  isEditMode.value = true;
  formData.value = { ...employee };
  showDialog.value = true;
};

/**
 * 删除员工（显示确认弹窗并执行）
 * @param employee 要删除的员工对象
 */
const deleteEmployee = (employee: Employee) => {
  ElMessageBox.confirm(
    `确认删除员工【${employee.name}】吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    // 用户点击了确认
    try {
      const response = await request.delete(`/employees/${employee.id}`);
      ElMessage.success(response.message || '删除成功');
      await loadEmployees(); // 重新加载数据
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }).catch(() => {
    // 用户点击了取消
    ElMessage.info('已取消删除');
  });
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
      response = await request.put(`/employees/${formData.value.id}`, submitData);
    } else {
      // 新增模式，发送 POST 请求
      response = await request.post('/employees', submitData);
    }

    ElMessage.success(response.message || '操作成功');
    await loadEmployees(); // 成功后刷新列表
    showDialog.value = false; // 关闭弹窗
  } catch (error: any) {
    // 捕获校验失败或请求失败的错误
    if (typeof error === 'object' && error !== null && 'message' in error) {
       // API 返回的业务错误
       ElMessage.error(error.message || '操作失败');
    }
    // 如果是校验未通过，ElementPlus 会自动处理提示，这里可不作额外处理
  }
};


// ========== 生命周期钩子 ==========

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

.pagination-container {
  position: fixed;
  left: 0;
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
  /* 确保分页控件在适当的层级 */
}

.custom-pager :deep(.el-pager li.is-active) {
  background-color: #409eff;
  color: #fff;
}

.form-with-spacing .el-form-item {
  margin-bottom: 15px;
}
</style>