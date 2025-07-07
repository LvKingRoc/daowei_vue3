<template>
  <div class="container">
    <!-- 搜索与操作区域 -->
    <div class="search-container">
      <el-input v-model="state.searchKeyword" placeholder="请输入账号" class="search-input" clearable />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="success" @click="showAddDialog">新增用户</el-button>
    </div>

    <!-- 用户信息表格 -->
    <div class="table-container">
      <el-table
        v-loading="state.loading"
        :data="paginatedUsers"
        style="width: 100%"
        stripe
        border
        size="small"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="username" label="账号" min-width="120" align="center" sortable="custom" />
        <el-table-column prop="password" label="密码" min-width="120" align="center">
          <template #default="{ row }">
            <span>{{ maskPassword(row.password) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" min-width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.name || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="150" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.phone || '无' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="showDeleteDialog(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <span class="pagination-text">总计 {{ totalUsers }} 条</span>
      <el-select v-model="state.pagination.pageSize" class="page-size-select" @change="handlePageSizeChange">
        <el-option v-for="size in [10, 20, 50, 100]" :key="size" :label="`${size}条/页`" :value="size" />
      </el-select>
      <el-pagination
        v-model:current-page="state.pagination.currentPage"
        :page-size="state.pagination.pageSize"
        :total="totalUsers"
        layout="prev, pager, next"
        :pager-count="5"
        background
        @current-change="handleCurrentChange"
      />
      <span class="pagination-text">前往</span>
      <el-input
        v-model="state.pagination.jumpPage"
        class="page-jumper"
        placeholder="页码"
        type="number"
        :min="1"
        :max="Math.ceil(totalUsers / state.pagination.pageSize)"
        @keyup.enter="handleJumpPage"
      />
      <span class="pagination-text">页</span>
      <el-button type="primary" class="go-btn" @click="handleJumpPage">GO</el-button>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog :title="dialogs.form.isEditMode ? '编辑用户' : '新增用户'" v-model="dialogs.form.visible" width="500px">
      <el-form ref="userFormRef" :model="dialogs.form.data" :rules="formRules" label-width="100px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="dialogs.form.data.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="dialogs.form.data.password"
            type="text"
            :placeholder="dialogs.form.isEditMode ? '如需修改请输入新密码' : '请输入密码'"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialogs.form.data.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="dialogs.form.data.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.form.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="dialogs.delete.visible" title="删除确认" width="500px" :close-on-click-modal="false">
      <div class="delete-dialog-content">
        <div class="delete-dialog-header">
          <i class="el-icon-warning" style="color: #e6a23c; font-size: 20px;"></i>
          <span>确认删除以下用户吗？</span>
        </div>
        <div class="delete-dialog-body">
          <p><strong>账号：</strong>{{ dialogs.delete.data.username }}</p>
          <p><strong>姓名：</strong>{{ dialogs.delete.data.name }}</p>
          <p><strong>手机号：</strong>{{ dialogs.delete.data.phone }}</p>
        </div>
        <div class="delete-dialog-footer">
          此操作不可恢复，请谨慎操作！
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogs.delete.visible = false">取消</el-button>
        <el-button type="danger" @click="executeDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import request from '@/core/utils/request';

// --- 类型定义 ---

/**
 * 用户数据结构
 */
interface User {
  id: number;
  username: string;
  password?: string; // 密码在编辑时可能为空
  name: string;
  phone: string;
  [key: string]: any; // 允许通过字符串索引访问属性，用于动态排序
}

/**
 * 排序状态
 */
interface SortState {
  prop: string;
  order: 'ascending' | 'descending' | '';
}

// --- 响应式状态管理 ---

// 创建一个生成默认用户对象的函数，方便重置表单
const createDefaultUser = (): User => ({
  id: 0,
  username: '',
  password: '',
  name: '',
  phone: '',
});

// 核心状态：表格数据、加载状态、搜索和分页
const state = reactive({
  loading: false,
  users: [] as User[],
  searchKeyword: '',
  sort: { prop: '', order: '' } as SortState,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    jumpPage: '',
  },
});

// 弹窗状态：管理所有弹窗的显示/隐藏、表单数据等
const dialogs = reactive({
  form: {
    visible: false,
    isEditMode: false,
    data: createDefaultUser(),
  },
  delete: {
    visible: false,
    data: createDefaultUser(),
  },
});

// 模板引用：用于访问表单实例
const userFormRef = ref<FormInstance>();

// --- 表单验证规则 ---

const formRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{3,20}$/, message: '账号为3-20位的字母和数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为6-20个字符', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号', trigger: 'blur' },
  ],
});

// --- 计算属性 ---

/**
 * 根据搜索关键词和排序规则过滤和排序用户列表
 */
const filteredAndSortedUsers = computed(() => {
  let result = [...state.users];

  // 搜索过滤
  if (state.searchKeyword) {
    const keyword = state.searchKeyword.toLowerCase();
    result = result.filter(user => user.username.toLowerCase().includes(keyword));
  }

  // 动态排序
  const { prop, order } = state.sort;
  if (prop && order) {
    result.sort((a, b) => {
      const valA = String(a[prop] ?? '').toLowerCase();
      const valB = String(b[prop] ?? '').toLowerCase();
      if (order === 'ascending') {
        return valA.localeCompare(valB);
      }
      return valB.localeCompare(valA);
    });
  }

  return result;
});

/**
 * 当前页应显示的数据
 */
const paginatedUsers = computed(() => {
  const start = (state.pagination.currentPage - 1) * state.pagination.pageSize;
  const end = start + state.pagination.pageSize;
  return filteredAndSortedUsers.value.slice(start, end);
});

/**
 * 过滤后的总用户数
 */
const totalUsers = computed(() => filteredAndSortedUsers.value.length);

// --- 工具函数 ---

/**
 * 密码脱敏显示
 * @param password 原始密码
 * @returns 脱敏后的密码字符串
 */
const maskPassword = (password?: string) => {
  return password ? '********' : '无';
};

// --- API 调用 ---

/**
 * 从服务器获取所有用户数据
 */
const fetchUsers = async () => {
  state.loading = true;
  try {
    const response = await request.get('/user/findAll');
    state.users = response.data || [];
  } catch (error: any) {
    ElMessage.error(`获取用户列表失败: ${error.message}`);
  } finally {
    state.loading = false;
  }
};

/**
 * 提交表单（新增或编辑用户）
 */
const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate();

  try {
    const { isEditMode, data } = dialogs.form;
    const endpoint = isEditMode ? '/user/update' : '/user/add';
    const method = isEditMode ? request.put : request.post;

    const payload = { ...data };

    const response = await method(endpoint, payload);
    ElMessage.success(response.message || '操作成功');
    dialogs.form.visible = false;
    await fetchUsers(); // 重新加载数据
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
};

/**
 * 执行删除操作
 */
const executeDelete = async () => {
  try {
    const { id } = dialogs.delete.data;
    const response = await request.delete(`/user/delete/${id}`);
    ElMessage.success(response.message || '删除成功');
    dialogs.delete.visible = false;
    await fetchUsers();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '删除失败');
  }
};

// --- 事件处理 ---

/**
 * 搜索按钮点击事件
 */
const handleSearch = () => {
  state.pagination.currentPage = 1;
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  state.searchKeyword = '';
  state.pagination.currentPage = 1;
};

/**
 * 处理表格排序变化
 */
const handleSortChange = ({ prop, order }: SortState) => {
  state.sort = { prop, order: order || '' };
};

/**
 * 处理每页显示数量变化
 */
const handlePageSizeChange = (newSize: number) => {
  state.pagination.pageSize = newSize;
  state.pagination.currentPage = 1;
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (newPage: number) => {
  state.pagination.currentPage = newPage;
};

/**
 * 处理页面跳转
 */
const handleJumpPage = () => {
  const page = parseInt(state.pagination.jumpPage, 10);
  const maxPage = Math.ceil(totalUsers.value / state.pagination.pageSize) || 1;
  if (!isNaN(page) && page >= 1 && page <= maxPage) {
    state.pagination.currentPage = page;
  } else {
    ElMessage.error(`请输入 1 到 ${maxPage} 之间的有效页码`);
  }
  state.pagination.jumpPage = '';
};

/**
 * 显示新增用户弹窗
 */
const showAddDialog = () => {
  dialogs.form.isEditMode = false;
  dialogs.form.data = createDefaultUser();
  dialogs.form.visible = true;
  nextTick(() => userFormRef.value?.clearValidate());
};

/**
 * 显示编辑用户弹窗
 * @param user 要编辑的用户对象
 */
const showEditDialog = (user: User) => {
  dialogs.form.isEditMode = true;
  // 创建副本以避免直接修改原始数据，并填充包括密码在内的所有字段
  dialogs.form.data = { ...user };
  dialogs.form.visible = true;
  nextTick(() => userFormRef.value?.clearValidate());
};

/**
 * 显示删除确认弹窗
 * @param user 要删除的用户对象
 */
const showDeleteDialog = (user: User) => {
  dialogs.delete.data = { ...user };
  dialogs.delete.visible = true;
};

// --- 生命周期钩子 ---

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/**
 * 整体容器样式
 */
.container {
  padding: 20px;
  background-color: #f5f7fa;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

/**
 * 搜索容器样式
 */
.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 220px;
}

/**
 * 表格容器样式
 */
.table-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  padding: 15px;
  margin-bottom: 20px;
  overflow-x: auto;
}

/**
 * 分页容器样式
 * 固定在页面底部，提供良好的用户体验
 */
.pagination-container {
  position: fixed;
  left: 200px; /* 假设侧边栏宽度为200px，可根据实际情况调整 */
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  padding: 10px 20px;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  z-index: 1000;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

.pagination-text {
  font-size: 14px;
  color: #606266;
}

.page-size-select {
  width: 110px;
}

.page-jumper {
  width: 70px;
}

.go-btn {
  height: 32px;
  padding: 0 12px;
}

/**
 * 删除确认弹窗内容样式
 */
.delete-dialog-content {
  text-align: center;
}
.delete-dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
}
.delete-dialog-body {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  text-align: left;
  margin-bottom: 20px;
}
.delete-dialog-body p {
  margin: 8px 0;
  font-size: 14px;
}
.delete-dialog-body p strong {
  display: inline-block;
  width: 70px;
  color: #606266;
}
.delete-dialog-footer {
  padding: 10px;
  background-color: #fef0f0;
  color: #f56c6c;
  font-weight: bold;
  border-radius: 4px;
}
</style>