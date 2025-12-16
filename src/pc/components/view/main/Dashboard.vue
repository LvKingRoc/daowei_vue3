<template>
  <div class="dashboard-container">
    <!-- 顶部数据区域 -->
    <div class="top-container">
      <div class="grid-layout">
        <!-- 左上数据卡片: 总待收款 -->
        <div class="grid-item">
          <el-card class="data-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  <CountTo :start-val="0" :end-val="totalAmount" :duration="2000" :decimals="2" />
                </div>
                <div class="card-title">总待收款（人民币/元）</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 中间图表卡片: 订单状态分布 -->
        <div class="grid-item center">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">订单状态分布</span>
              </div>
            </template>
            <div ref="statusChart" class="main-chart"></div>
          </el-card>
        </div>

        <!-- 右上数据卡片: 总客户数 -->
        <div class="grid-item">
          <el-card class="data-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  <CountTo :start-val="0" :end-val="customerCount" :duration="2000" />
                </div>
                <div class="card-title">总客户数</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 左下数据卡片: 近30天订单数 -->
        <div class="grid-item">
          <el-card class="data-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  <CountTo :start-val="0" :end-val="orderCount" :duration="2000" />
                </div>
                <div class="card-title">近30天订单数</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右下数据卡片: 总样品数 -->
        <div class="grid-item">
          <el-card class="data-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><Box /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  <CountTo :start-val="0" :end-val="sampleCount" :duration="2000" />
                </div>
                <div class="card-title">总样品数</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 底部数据区域 -->
    <div class="bottom-container">
      <el-row :gutter="24">
        <!-- 订单产品列表 (v-for 循环渲染) -->
        <el-col :span="6" v-for="list in productLists" :key="list.title">
          <el-card class="list-card" shadow="hover">
            <template #header>
              <div class="list-header">
                <span class="list-title">{{ list.title }}</span>
                <el-tag :type="list.type" effect="plain" class="list-tag">{{ list.data.length }}个</el-tag>
              </div>
            </template>
            <div class="product-list custom-scrollbar">
              <el-table :data="list.data" :show-header="false" style="width: 100%">
                <el-table-column prop="orderNumber" label="订单号" min-width="120">
                  <template #default="{ row }">
                    <div class="table-cell-content">
                      <div class="order-row">
                        <span class="order-number">{{ row.orderNumber }}</span>
                        <span class="quantity-tag">{{ row.quantity }}件</span>
                      </div>
                      <div class="product-row">
                        <span class="product-details">{{ row.model }} · {{ row.color }}</span>
                        <span class="customer-name">{{ row.customer }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
        <!-- 员工通讯录列表 -->
        <el-col :span="6">
          <el-card class="list-card" shadow="hover">
            <template #header>
              <div class="list-header">
                <span class="list-title">员工通讯录</span>
                <el-tag type="info" effect="plain" class="list-tag">{{ employees.length }}人</el-tag>
              </div>
            </template>
            <div class="employee-list custom-scrollbar">
              <div v-for="(employee, index) in employees" :key="index" class="employee-item">
                <div class="employee-avatar">
                  <el-avatar :size="32" :style="{ backgroundColor: getAvatarColor(index) }">{{ employee.name.charAt(0) }}</el-avatar>
                </div>
                <div class="employee-info">
                  <span class="employee-name">{{ employee.name }}</span>
                  <span class="employee-phone">{{ employee.phone }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
// 按需引入 ECharts，减小打包体积
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { CountTo } from 'vue3-count-to'
import { ElMessage } from 'element-plus'
import { Money, ShoppingCart, User, Box } from '@element-plus/icons-vue'
import { dashboardApi } from '@/core/api/dashboard'

// 注册 ECharts 组件
echarts.use([TooltipComponent, LegendComponent, GridComponent, PieChart, CanvasRenderer])

// 响应式数据
const totalAmount = ref(0)
const orderCount = ref(0)
const customerCount = ref(0)
const sampleCount = ref(0)
const statusChart = ref(null)
let statusChartInstance = null

// 产品和员工数据
const pendingProducts = ref([])
const producingProducts = ref([])
const shippingProducts = ref([])
const employees = ref([])

/**
 * 将产品列表数据和其对应的卡片配置组合，用于 v-for 循环渲染，以简化模板。
 * @type {import('vue').Ref<Array<{title: string, type: string, data: import('vue').Ref<any[]>}>>}
 */
const productLists = ref([
  { title: '待生产订单产品', type: 'warning', data: pendingProducts },
  { title: '生产中订单产品', type: 'primary', data: producingProducts },
  { title: '待发货订单产品', type: 'success', data: shippingProducts }
])

// 获取头像颜色
const avatarColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
const getAvatarColor = (index) => {
  return avatarColors[index % avatarColors.length]
}

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    const response = await dashboardApi.summary()

    // 根据ResponseHandler架构，数据在response.data中
    const data = response.data || response

    // 更新数据
    totalAmount.value = data.totalPendingAmount || 0
    orderCount.value = data.recentOrderCount || 0
    customerCount.value = data.totalCustomerCount || 0
    sampleCount.value = data.totalSampleCount || 0

    // 更新产品列表
    pendingProducts.value = data.pendingProducts || []
    producingProducts.value = data.producingProducts || []
    shippingProducts.value = data.shippingProducts || []

    // 更新员工列表
    employees.value = data.employees || []

    // 更新图表数据
    if (statusChartInstance && data.statusDistribution) {
      updateStatusChart(data.statusDistribution)
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败，请稍后重试')
  }
}

// 初始化状态分布图表
const initStatusChart = () => {
  const chart = echarts.init(statusChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      top: 10,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
    },
    grid: {
      containLabel: true,
      left: 0,
      right: 0,
      top: 0,
      bottom: 50
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['0%', '50%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}-{c}单',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        distanceToLabelLine: 5,
        overflow: 'none'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
        smooth: true
      },
      data: []
    }]
  })
  return chart
}

// 更新图表数据
const updateStatusChart = (statusData) => {
  if (!statusChartInstance) return
  
  // 定义状态到颜色的映射
  const colorMap = {
    '待生产': '#ffd666',
    '生产中': '#5cdbd3',
    '待发货': '#95de64',
    '待收款': '#ff9c6e'
  }
  
  // 过滤掉"已完成"状态，并为每个状态添加颜色
  const chartData = statusData
    .filter((item) => item.name !== '已完成')
    .map((item) => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: colorMap[item.name] || '#909399' // 如果没有匹配的颜色，使用默认灰色
      }
    }))
  
  // 提取图例数据
  const legendData = chartData.map((item) => item.name)
  
  // 更新图表配置，仅更新变化的部分以提高性能
  statusChartInstance.setOption({
    legend: {
      data: legendData
    },
    series: [
      {
        data: chartData,
        // 微调饼图中心位置，以更好地适应图例
        center: ['50%', '45%']
      }
    ]
  })
}

// 监听窗口大小变化
const handleResize = () => statusChartInstance?.resize()

// 组件生命周期
onMounted(() => {
  nextTick(() => {
    statusChartInstance = initStatusChart()
    window.addEventListener('resize', handleResize)
    
    // 获取数据
    fetchDashboardData()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  statusChartInstance?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f6f8fa;
  min-height: calc(100vh - 95px);
  margin-top: -105px;
}

.top-container {
  padding-top: 105px;
  margin-bottom: 24px;
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 24px;
  height: 600px;
  width: 100%;
}

.grid-item {
  width: 100%;
  height: 100%;
}

.grid-item.center {
  grid-row: span 2;
  grid-column: 2;
}

/* 卡片样式 */
.data-card, .chart-card {
  height: 100%;
  background: #fff;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card {
  z-index: 10;
  overflow: visible !important;
}

.chart-card :deep(.el-card__header) {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #eef0f2;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  overflow: visible !important;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.data-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.data-card:hover, .chart-card:hover, .list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

/* 卡片内容样式 */
.card-content {
  position: relative;
  padding: 24px;
  height: 100%;
  display: flex;
  align-items: center;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary) 100%);
  box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.2);
}

.card-icon :deep(.el-icon) {
  font-size: 28px;
  color: #fff;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin-bottom: 10px;
}

.card-title {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* 图表样式 */
.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef0f2;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: block;
}

.main-chart {
  height: 500px !important;
  padding: 20px;
  position: relative;
  z-index: 10;
  overflow: visible !important;
}

/* 列表卡片样式 */
.list-card {
  height: 520px;
  display: flex;
  flex-direction: column;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.list-card .el-card__body {
  flex: 1 1 0%;
  height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eef0f2;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.list-tag {
  font-weight: 500;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
}

/* 列表内容样式 */
.product-list,
.employee-list {
  flex: 1 1 0%;
  height: auto;
  max-height: 380px;
  overflow-y: auto;
  padding: 16px;
}

/* 自定义滚动条 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f6f8fa;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f6f8fa;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

/* 表格单元格样式 */
.table-cell-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-row, .product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.order-number {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.product-details {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.customer-name {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.quantity-tag {
  display: inline-block;
  padding: 3px 10px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

/* 员工项样式 */
.employee-item {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 10px;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.employee-item:hover {
  background-color: #f6f8fa;
}

.employee-avatar {
  margin-right: 16px;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.employee-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.employee-phone {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 表格样式重写 */
:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-hover-bg-color: #f6f8fa;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table .cell) {
  padding: 12px 0;
}

:deep(.el-table__row) {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__row:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.bottom-container {
  margin-top: 24px;
}

/* 响应式样式 */
@media (max-width: 1400px) {
  .grid-layout {
    height: 500px;
  }
  
  .card-value {
    font-size: 28px;
  }
  
  .main-chart {
    height: 400px !important;
  }
}
</style>
