<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-input v-model="searchOrderNumber" placeholder="根据订单号搜索" class="search-input" clearable />
      <el-input v-model="searchModel" placeholder="根据型号搜索" class="search-input" clearable />
      <el-input v-model="searchCompanyName" placeholder="根据客户企业名称搜索" class="search-input" clearable />
      <el-select v-model="searchStatus" placeholder="选择状态" class="search-input" clearable>
        <el-option v-for="(label, value) in statusMap" :key="value" :label="label" :value="value" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table :data="currentPageItems" style="width: 100%" stripe border size="small" v-loading="loading"
        :cell-style="{ padding: '12px 8px' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
        @sort-change="handleSortChange">
        <el-table-column prop="orderNumber" label="订单号" min-width="120" align="center" sortable="custom" />
        <el-table-column prop="model" label="型号" min-width="120" align="center" sortable="custom" />
        <el-table-column prop="colorCode" label="颜色" min-width="100" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.colorCode || '无' }}
          </template>
        </el-table-column>
        <el-table-column label="图片" min-width="120" align="center">
          <template #default="{ row }">
            <div class="image-cell">
              <el-image v-if="row.image" style="width: 80px; height: 80px" :src="getImageUrl(row.image)"
                :preview-src-list="[getImageUrl(row.image)]" fit="cover" hide-on-click-modal lazy
                :preview-teleported="true" :initial-index="0" class="order-image">
                <template #error>
                  <div class="image-error">
                    <el-icon>
                      <Picture />
                    </el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>无图片</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户企业名称" min-width="120" align="center" sortable="custom" prop="companyName">
          <template #default="{ row }">
            {{ row.companyName || '无' }}
          </template>
        </el-table-column>
        <el-table-column label="总数量" min-width="100" align="center" sortable="custom" prop="totalQuantity">
          <template #default="{ row }">
            {{ row.totalQuantity || row.totalQuantity === 0 ? row.totalQuantity : '无' }}
          </template>
        </el-table-column>
        <el-table-column label="总金额" min-width="120" align="center" sortable="custom" prop="totalAmount">
          <template #default="{ row }">
            {{ row.totalAmount || row.totalAmount === 0 ? row.totalAmount.toFixed(2) : '无' }}
          </template>
        </el-table-column>
        <el-table-column label="订单创建日期" min-width="100" align="center" sortable="custom" prop="createDate">
          <template #default="{ row }">
            {{ row.createDate ? formatDate(row.createDate) : '无' }}
          </template>
        </el-table-column>
        <el-table-column label="最后交货日期" min-width="100" align="center" sortable="custom" prop="deliveryDate">
          <template #default="{ row }">
            {{ row.deliveryDate ? formatDate(row.deliveryDate) : '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="90" align="center" sortable="custom">
          <template #default="{ row }">
            <el-dropdown @command="(command) => handleStatusChange(row, command)" trigger="click">
              <el-button :type="getStatusTagType(row.status)" size="small">
                {{ statusMap[row.status] }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="(label, value) in statusMap" :key="value" :command="value"
                    :disabled="row.status === value">
                    {{ label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="editOrder(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteOrder(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <span class="pagination-text">总数：{{ totalItems }}条数据</span>
      <el-select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
        <el-option v-for="size in [10, 20, 50, 100]" :key="size" :label="`${size}条/页`" :value="size" />
      </el-select>
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="totalItems" layout="pager"
        :pager-count="5" class="custom-pager" @current-change="handleCurrentChange" />
      <span class="pagination-text">去到</span>
      <el-input v-model="jumpPage" class="page-jumper" placeholder="页码" type="number" :min="1"
        :max="Math.ceil(totalItems / pageSize)" @keyup.enter="handleJumpPage" />
      <span class="pagination-text">页</span>
      <el-button type="primary" class="go-btn" @click="handleJumpPage">Go</el-button>
    </div>

    <!-- 编辑弹窗 -->
    <el-config-provider :locale="locale">
      <el-dialog v-model="showDialog" :title="formData.id ? '编辑订单' : '新增订单'" width="600px"
        :close-on-click-modal="false">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" class="form-container">
          <div class="form-header">
            <div class="model-color-info">
              <div class="info-item">
                <div class="label">型号</div>
                <div class="value">{{ formData.model }}</div>
              </div>
              <div class="divider-line"></div>
              <div class="info-item">
                <div class="label">颜色</div>
                <div class="value">{{ formData.colorCode }}</div>
              </div>
            </div>
          </div>
          <el-divider class="form-divider" />
          <div class="form-body">
            <el-form-item label="订单号" prop="orderNumber">
              <el-input v-model="formData.orderNumber" placeholder="请输入订单号" class="custom-input" />
            </el-form-item>
            <el-form-item label="总数量" prop="totalQuantity">
              <el-input-number v-model="formData.totalQuantity" :min="0" :precision="0" :step="1" class="custom-number-input" />
            </el-form-item>
            <el-form-item label="总金额" prop="totalAmount">
              <el-input-number v-model="formData.totalAmount" :min="0" :precision="2" class="custom-number-input" />
            </el-form-item>
            <el-form-item label="订单创建日期" prop="createDate">
              <el-date-picker v-model="formData.createDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" class="custom-date-picker" :locale="locale" />
            </el-form-item>
            <el-form-item label="最后交货日期" prop="deliveryDate">
              <el-date-picker v-model="formData.deliveryDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" class="custom-date-picker" :locale="locale" />
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button type="primary" @click="validateAndSave">保存</el-button>
          </div>
        </template>
      </el-dialog>
    </el-config-provider>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteDialog" title="删除确认" width="500px" :close-on-click-modal="false">
      <div class="delete-warning-content">
        <div class="warning-title">
          <i class="el-icon-warning" style="color: #e6a23c; margin-right: 10px;"></i>
          <span style="margin-left: 10px;">确认删除以下订单？</span>
        </div>
        <div class="order-info">
          <p>订单号：{{ deleteItemData.orderNumber }}</p>
          <p>型号：{{ deleteItemData.model }}</p>
          <p>客户企业：{{ deleteItemData.companyName }}</p>
          <p>总金额：{{ deleteItemData.totalAmount?.toFixed(2) }}元</p>
        </div>
        <div class="warning-footer">
          此操作不可恢复，请谨慎操作！
        </div>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="executeDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 导入Vue核心功能、Element Plus组件、辅助库和配置文件
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import pinyin from 'pinyin'
import { ArrowDown, Picture } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import request from '@/core/utils/request.js'
import { getImageUrl } from '@/config/env.js'

// --- 状态定义 ---

// 组件全局状态
const loading = ref(false) // 全局加载状态
const locale = zhCn // Element Plus组件本地化

// 路由实例
const route = useRoute()

// 核心数据
const sortedOrders = ref([]) // 存储从API获取并排序后的订单列表

// 搜索状态
const searchOrderNumber = ref('')
const searchModel = ref('')
const searchCompanyName = ref('')
const searchStatus = ref('')

// 分页状态
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页显示条数
const jumpPage = ref('') // 跳转页码输入

// 排序状态
const sortState = ref({
  column: 'status', // 默认排序列
  order: 'ascending' // 默认排序顺序
})

// 对话框状态
const showDialog = ref(false) // 编辑/新增订单对话框
const showDeleteDialog = ref(false) // 删除确认对话框

// 表单数据与引用
const formRef = ref(null) // 表单引用，用于校验
const formData = ref({ // 表单数据模型
  id: null,
  orderNumber: '',
  sampleId: null,
  model: '',
  colorCode: '',
  companyName: '',
  totalQuantity: 0,
  totalAmount: 0,
  createDate: '',
  deliveryDate: '',
  status: 'PENDING'
})

// 待删除数据
const deleteItemData = ref({ // 存储待删除项的信息
  id: null,
  orderNumber: '',
  model: '',
  companyName: '',
  totalAmount: 0
})

// --- 表单校验规则 ---

// 自定义校验器：总数量
const validateQuantity = (rule, value, callback) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入总数量'))
  } else if (!Number.isInteger(value) || value <= 0) {
    callback(new Error('总数量必须为大于0的整数'))
  } else {
    callback()
  }
}

// 自定义校验器：总金额
const validateAmount = (rule, value, callback) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入总金额'))
  } else if (value <= 0) {
    callback(new Error('总金额必须大于0'))
  } else {
    callback()
  }
}

// 校验规则集
const rules = {
  orderNumber: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  totalQuantity: [{ required: true, validator: validateQuantity, trigger: 'blur' }],
  totalAmount: [{ required: true, validator: validateAmount, trigger: 'blur' }],
  createDate: [{ required: true, message: '请选择创建日期', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择交货日期', trigger: 'change' }]
}

// --- 工具函数 ---

/**
 * 获取文本的拼音 (全拼)
 * @param {string} text 输入文本
 * @returns {string} 全拼拼音
 */
const getPinyin = (text) => {
  if (!text) return ''
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('')
}

/**
 * 获取文本的拼音首字母
 * @param {string} text 输入文本
 * @returns {string} 拼音首字母
 */
const getPinyinInitials = (text) => {
  if (!text) return ''
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('')
}

/**
 * 文本模糊搜索函数，支持中文、拼音全拼和首字母
 * @param {string} source 源文本
 * @param {string} term 搜索词
 * @returns {boolean} 是否匹配
 */
const fuzzySearch = (source, term) => {
  if (!term) return true // 如果搜索词为空，则视为匹配
  if (!source) return false // 如果源文本为空，则不匹配

  const sourceText = String(source).toLowerCase()
  const searchTerm = term.toLowerCase()

  // 1. 直接匹配
  if (sourceText.includes(searchTerm)) return true

  // 2. 拼音全拼匹配
  const pinyinText = getPinyin(String(source)).toLowerCase()
  if (pinyinText.includes(searchTerm)) return true
  
  // 3. 拼音首字母匹配
  const pinyinInitialsText = getPinyinInitials(String(source)).toLowerCase()
  return pinyinInitialsText.includes(searchTerm)
}


// 订单状态映射
const statusMap = {
  PENDING: '待生产',
  IN_PROGRESS: '生产中',
  READY_TO_SHIP: '待发货',
  AWAITING_PAYMENT: '待收款',
  COMPLETED: '已完成'
}

// 状态排序权重
const statusOrder = {
  PENDING: 1,
  IN_PROGRESS: 2,
  READY_TO_SHIP: 3,
  AWAITING_PAYMENT: 4,
  COMPLETED: 5
}

/**
 * 根据状态获取Element Plus的Tag类型
 * @param {string} status 订单状态
 * @returns {string} Tag类型 ('warning', 'primary', etc.)
 */
const getStatusTagType = (status) => ({
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  READY_TO_SHIP: 'success',
  AWAITING_PAYMENT: 'danger',
  COMPLETED: 'info'
}[status] || 'info')

/**
 * 格式化日期
 * @param {string | Date} date 日期
 * @returns {string} 格式化后的日期字符串 'YYYY-MM-DD'
 */
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}


// --- 计算属性 ---

// 根据搜索条件过滤后的订单列表
const filteredItems = computed(() => {
  return sortedOrders.value.filter(order => {
    return fuzzySearch(order.orderNumber, searchOrderNumber.value) &&
           fuzzySearch(order.model, searchModel.value) &&
           fuzzySearch(order.companyName, searchCompanyName.value) &&
           (!searchStatus.value || order.status === searchStatus.value)
  })
})

// 当前页显示的订单项
const currentPageItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredItems.value.slice(start, end)
})

// 过滤后的总订单数
const totalItems = computed(() => filteredItems.value.length)


// --- API 操作 ---

/**
 * 从服务器加载订单列表
 */
const loadOrders = async () => {
    loading.value = true
  try {
    const response = await request.get('/orders')
    sortedOrders.value = response.data || []
    applySorting() // 加载后应用默认排序
  } catch (error) {
    ElMessage.error('加载订单列表失败')
    sortedOrders.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 更新订单状态
 * @param {object} row - 要更新的订单行数据
 * @param {string} newStatus - 新的订单状态
 */
const handleStatusChange = async (row, newStatus) => {
  try {
    const response = await request.put(`/orders/${row.id}`, { ...row, status: newStatus })
    row.status = newStatus // 本地更新状态以立即响应
    ElMessage.success(response.message || '状态更新成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '状态更新失败')
  }
}

/**
 * 执行删除订单操作
 */
const executeDelete = async () => {
  try {
    const { id } = deleteItemData.value
    const response = await request.delete(`/orders/${id}`)
    ElMessage.success(response.message || '删除成功')
    showDeleteDialog.value = false
    await loadOrders() // 重新加载数据
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

/**
 * 验证并保存表单（新增或编辑）
 */
const validateAndSave = async () => {
  try {
    await formRef.value.validate() // 触发表单验证

    // 准备提交的数据
    const payload = {
      orderNumber: formData.value.orderNumber,
      sampleId: formData.value.sampleId,
      totalQuantity: formData.value.totalQuantity,
      totalAmount: parseFloat(formData.value.totalAmount),
      createDate: formData.value.createDate,
      deliveryDate: formData.value.deliveryDate,
      status: formData.value.status || 'PENDING'
    }

    let response
    if (formData.value.id) {
      // 更新订单
      response = await request.put(`/orders/${formData.value.id}`, payload)
    } else {
      // 新增订单
      response = await request.post('/orders', payload)
    }
    
    ElMessage.success(response.message || '保存成功')
    showDialog.value = false
    await loadOrders() // 重新加载数据
  } catch (error) {
    // 验证失败或API错误时提示
    if (error && Array.isArray(error.errors)) {
      // 处理校验错误信息
    } else {
      ElMessage.error(error.response?.data?.message || '保存失败，请检查数据')
    }
  }
}


// --- 排序逻辑 ---

/**
 * 应用排序
 */
const applySorting = () => {
  const { column, order } = sortState.value
  if (!column || !order) return

  sortedOrders.value.sort((a, b) => {
    let valueA = a[column]
    let valueB = b[column]

    // 根据不同列类型处理值
    if (column === 'status') {
      valueA = statusOrder[a.status]
      valueB = statusOrder[b.status]
    } else if (['totalQuantity', 'totalAmount'].includes(column)) {
      valueA = parseFloat(valueA) || 0
      valueB = parseFloat(valueB) || 0
    } else if (['createDate', 'deliveryDate'].includes(column)) {
      valueA = valueA ? new Date(valueA).getTime() : 0
      valueB = valueB ? new Date(valueB).getTime() : 0
    } else {
      // 默认按字符串排序 (包括中文字符，按Unicode编码排序)
      valueA = String(valueA || '').toLowerCase()
      valueB = String(valueB || '').toLowerCase()
    }

    if (valueA === valueB) return 0
    
    // 根据排序方向返回结果
    const comparison = valueA > valueB ? 1 : -1
    return order === 'ascending' ? comparison : -comparison
  })
}

/**
 * 表格排序变化时触发
 * @param {object} { column, prop, order } - 排序参数
 */
const handleSortChange = ({ prop, order }) => {
  sortState.value = { column: prop, order: order || '' }
  applySorting()
}


// --- 事件处理 ---

// 执行搜索，重置到第一页
const handleSearch = () => {
  currentPage.value = 1
}

// 重置所有搜索条件
const resetSearch = () => {
  searchOrderNumber.value = ''
  searchModel.value = ''
  searchCompanyName.value = ''
  searchStatus.value = ''
  currentPage.value = 1
}

// 切换每页显示条数
const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 回到第一页
}

// 切换当前页
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// 跳转到指定页
const handleJumpPage = () => {
  if (!jumpPage.value) return
  const page = parseInt(jumpPage.value)
  const maxPage = Math.ceil(totalItems.value / pageSize.value) || 1
  if (isNaN(page) || page < 1 || page > maxPage) {
    ElMessage.error(`请输入1到${maxPage}之间的页码`)
    return
  }
  currentPage.value = page
  jumpPage.value = ''
}


// --- 对话框操作 ---

/**
 * 打开编辑订单对话框
 * @param {object} order - 要编辑的订单数据
 */
const editOrder = (order) => {
    formData.value = {
      ...order,
    createDate: order.createDate ? formatDate(order.createDate) : '',
    deliveryDate: order.deliveryDate ? formatDate(order.deliveryDate) : ''
    }
    showDialog.value = true
}

/**
 * 打开删除确认对话框
 * @param {object} row - 要删除的行数据
 */
const deleteOrder = (row) => {
    deleteItemData.value = {
      id: row.id,
      orderNumber: row.orderNumber,
      model: row.model,
      companyName: row.companyName,
      totalAmount: row.totalAmount
  }
  showDeleteDialog.value = true
}


// --- 生命周期钩子 ---

// 组件挂载后执行
onMounted(async () => {
  // 检查路由参数，如果有名为 sampleId 的参数，则用于快速创建订单
  const sampleId = route.query.sampleId
  if (sampleId) {
    try {
      const response = await request.get(`/samples/${sampleId}`)
      const sample = response.data
      
      // 使用样品信息预填充表单
      formData.value = {
        id: null,
        orderNumber: '',
        sampleId: sampleId,
        model: sample.model,
        colorCode: sample.colorCode,
        companyName: sample.companyName,
        totalQuantity: 0,
        totalAmount: sample.unitPrice || 0,
        createDate: formatDate(new Date()),
        deliveryDate: formatDate(new Date()),
        status: 'PENDING'
      }
      showDialog.value = true // 直接打开新增对话框
    } catch (error) {
      ElMessage.error('获取样品信息失败')
    }
  }
  // 加载订单列表
  await loadOrders()
})
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

.form-container {
  background: #fff;
  padding: 20px;
}

.form-header {
  padding: 0 0 5px;
  display: flex;
  justify-content: center;
}

.model-color-info {
  display: flex;
  align-items: stretch;
  gap: 30px;
  padding: 5px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.label {
  font-size: 14px;
  color: #909399;
  line-height: 1.2;
}

.value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.divider-line {
  width: 1px;
  background-color: #DCDFE6;
}

.form-divider {
  margin: 10px 0;
}

.form-body {
  padding: 0;
}

.custom-input,
.custom-number-input,
.custom-date-picker,
.custom-select {
  width: 300px;
}

.dialog-footer {
  padding-top: 20px;
  text-align: right;
}

.image-cell {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
  font-size: 14px;
  gap: 4px;
}

.order-image {
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.order-image:hover {
  transform: scale(1.05);
}

/* 删除确认弹窗样式 */
.delete-warning-content {
  background-color: #fff;
}

.warning-title {
  background-color: #fdf6ec;
  padding: 15px 20px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #faecd8;
}

.order-info {
  padding: 15px 20px;
  background-color: #fff;
}

.order-info p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.warning-footer {
  padding: 15px 20px;
  background-color: #fff8f8;
  color: #f56c6c;
  font-weight: bold;
  text-align: center;
  border-top: 1px solid #fde2e2;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-button) {
  padding: 8px 20px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-divider--horizontal) {
  margin: 16px 0;
  border-top: 1px solid #ebeef5;
}
</style>