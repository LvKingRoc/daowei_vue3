<template>
  <div class="log-management">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="请选择模块" clearable style="width: 150px">
            <el-option label="客户管理" value="客户管理" />
            <el-option label="样板管理" value="样板管理" />
            <el-option label="订单管理" value="订单管理" />
            <el-option label="员工管理" value="员工管理" />
            <el-option label="用户管理" value="用户管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="请选择操作" clearable style="width: 120px">
            <el-option label="新增" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="查询" value="QUERY" />
            <el-option label="登录" value="LOGIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>操作日志列表</span>
          <el-button type="danger" size="small" @click="handleCleanLogs">
            <el-icon><Delete /></el-icon>清理30天前日志
          </el-button>
        </div>
      </template>

      <el-table :data="logList" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.username || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="action" label="操作" width="80">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="requestMethod" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.requestMethod)" size="small">
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requestUrl" label="请求路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100" align="right">
          <template #default="{ row }">
            <span :class="getDurationClass(row.duration)">{{ row.duration }}ms</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页控件 -->
    <PaginationBar 
      v-model:current-page="pagination.pageNum" 
      v-model:page-size="pagination.pageSize" 
      :total="pagination.total"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange" 
    />

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentLog.role }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getActionLabel(currentLog.action) }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ currentLog.requestUrl }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="执行时长">{{ currentLog.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatTime(currentLog.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <el-input
            v-model="currentLog.requestParams"
            type="textarea"
            :rows="3"
            readonly
          />
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog.oldData" label="修改前数据" :span="2">
          <el-input
            v-model="currentLog.oldData"
            type="textarea"
            :rows="4"
            readonly
            class="old-data"
          />
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog.newData" label="修改后数据" :span="2">
          <el-input
            v-model="currentLog.newData"
            type="textarea"
            :rows="4"
            readonly
            class="new-data"
          />
        </el-descriptions-item>
        <el-descriptions-item label="响应数据" :span="2">
          <el-input
            v-model="currentLog.responseData"
            type="textarea"
            :rows="3"
            readonly
          />
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog.errorMsg" label="错误信息" :span="2">
          <el-text type="danger">{{ currentLog.errorMsg }}</el-text>
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">
          <el-text size="small">{{ currentLog.userAgent }}</el-text>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PaginationBar from '@/pc/components/common/PaginationBar.vue';
import '@/pc/components/common/management-common.css';
import { Search, Refresh, Delete } from '@element-plus/icons-vue';
import logApi from '@/core/api/log';
import dayjs from 'dayjs';

// 搜索表单
const searchForm = reactive({
  username: '',
  module: '',
  action: ''
});
const dateRange = ref([]);

// 表格数据
const logList = ref([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
});
const jumpPage = ref('');

// 详情弹窗
const detailVisible = ref(false);
const currentLog = ref({});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      username: searchForm.username || undefined,
      module: searchForm.module || undefined,
      action: searchForm.action || undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    };

    const hasCondition = searchForm.username || searchForm.module || searchForm.action || dateRange.value?.length;
    const res = hasCondition
      ? await logApi.search(params)
      : await logApi.getList(pagination.pageNum, pagination.pageSize);

    if (res.success) {
      logList.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('加载日志失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.username = '';
  searchForm.module = '';
  searchForm.action = '';
  dateRange.value = [];
  pagination.pageNum = 1;
  loadData();
};

// 分页
const handleSizeChange = () => {
  pagination.pageNum = 1;
  loadData();
};

const handleCurrentChange = (page) => {
  pagination.pageNum = page;
  loadData();
};

const handleJumpPage = () => {
  const maxPage = Math.ceil(pagination.total / pagination.pageSize);
  const page = Number(jumpPage.value);
  if (page >= 1 && page <= maxPage) {
    pagination.pageNum = page;
    loadData();
  }
  jumpPage.value = '';
};

// 查看详情
const handleViewDetail = (row) => {
  currentLog.value = { ...row };
  detailVisible.value = true;
};

// 清理日志
const handleCleanLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清理30天前的日志吗？此操作不可恢复！', '警告', {
      type: 'warning'
    });
    const res = await logApi.cleanOldLogs(30);
    if (res.success) {
      ElMessage.success(res.message);
      loadData();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理失败');
    }
  }
};

// 格式化时间
const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 获取操作类型标签
const getActionLabel = (action) => {
  const map = {
    CREATE: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    QUERY: '查询',
    LOGIN: '登录'
  };
  return map[action] || action;
};

// 获取操作类型颜色
const getActionType = (action) => {
  const map = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    QUERY: 'info',
    LOGIN: 'primary'
  };
  return map[action] || 'info';
};

// 获取HTTP方法颜色
const getMethodType = (method) => {
  const map = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger'
  };
  return map[method] || 'info';
};

// 获取耗时样式
const getDurationClass = (duration) => {
  if (duration > 1000) return 'duration-slow';
  if (duration > 500) return 'duration-medium';
  return 'duration-fast';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.log-management {
  padding: 20px;
  padding-bottom: 70px; /* 为固定分页栏预留空间 */
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duration-fast {
  color: #67c23a;
}

.duration-medium {
  color: #e6a23c;
}

.duration-slow {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.old-data textarea) {
  background-color: #fef0f0 !important;
  border-color: #fab6b6 !important;
}

:deep(.new-data textarea) {
  background-color: #f0f9eb !important;
  border-color: #b3e19d !important;
}
</style>
