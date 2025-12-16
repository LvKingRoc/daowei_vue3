<!-- PC端AI工具集合组件 -->
<template>
  <div class="pc-ai-container">
    <!-- AI工具标签页 -->
    <el-tabs type="border-card">
      <!-- 通用对话AI标签页 -->
      <el-tab-pane>
        <template #label>
          <el-icon><ChatLineRound /></el-icon>
          <span>通用对话AI</span>
        </template>
        <div class="ai-cards-grid">
          <el-card
            v-for="item in generalAI"
            :key="item.name"
            class="ai-tool-card"
            :class="{ 'login-required': item.needLogin }"
          >
            <template #header>
              <div class="card-header-content">
                <h3 class="tool-name">{{ item.name }}</h3>
                <el-tag :type="item.needLogin ? 'danger' : 'success'" size="small">
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </el-tag>
              </div>
            </template>
            <p class="tool-description">{{ item.description }}</p>
            <div class="card-footer-actions">
              <el-button type="primary" @click="openUrl(item.url)" size="small">
                立即访问
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 写作AI标签页 -->
      <el-tab-pane>
        <template #label>
          <el-icon><Edit /></el-icon>
          <span>写作AI</span>
        </template>
        <div class="ai-cards-grid">
          <el-card
            v-for="item in writingAI"
            :key="item.name"
            class="ai-tool-card"
            :class="{ 'login-required': item.needLogin }"
          >
            <template #header>
              <div class="card-header-content">
                <h3 class="tool-name">{{ item.name }}</h3>
                <el-tag :type="item.needLogin ? 'danger' : 'success'" size="small">
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </el-tag>
              </div>
            </template>
            <p class="tool-description">{{ item.description }}</p>
            <div class="card-footer-actions">
              <el-button type="primary" @click="openUrl(item.url)" size="small">
                立即访问
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 开发AI标签页 -->
      <el-tab-pane>
        <template #label>
          <el-icon><Monitor /></el-icon>
          <span>开发AI</span>
        </template>
        <div class="ai-cards-grid">
          <el-card
            v-for="item in devAI"
            :key="item.name"
            class="ai-tool-card"
            :class="{ 'login-required': item.needLogin }"
          >
            <template #header>
              <div class="card-header-content">
                <h3 class="tool-name">{{ item.name }}</h3>
                <el-tag :type="item.needLogin ? 'danger' : 'success'" size="small">
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </el-tag>
              </div>
            </template>
            <p class="tool-description">{{ item.description }}</p>
            <div class="card-footer-actions">
              <el-button type="primary" @click="openUrl(item.url)" size="small">
                立即访问
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 艺术AI标签页 -->
      <el-tab-pane>
        <template #label>
          <el-icon><Picture /></el-icon>
          <span>艺术AI</span>
        </template>
        <div class="ai-cards-grid">
          <el-card
            v-for="item in artAI"
            :key="item.name"
            class="ai-tool-card"
            :class="{ 'login-required': item.needLogin }"
          >
            <template #header>
              <div class="card-header-content">
                <h3 class="tool-name">{{ item.name }}</h3>
                <el-tag :type="item.needLogin ? 'danger' : 'success'" size="small">
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </el-tag>
              </div>
            </template>
            <p class="tool-description">{{ item.description }}</p>
            <div class="card-footer-actions">
              <el-button type="primary" @click="openUrl(item.url)" size="small">
                立即访问
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 其他垂直AI标签页 -->
      <el-tab-pane>
        <template #label>
          <el-icon><More /></el-icon>
          <span>其他垂直AI</span>
        </template>
        <div class="ai-cards-grid">
          <el-card
            v-for="item in otherAI"
            :key="item.name"
            class="ai-tool-card"
            :class="{ 'login-required': item.needLogin }"
          >
            <template #header>
              <div class="card-header-content">
                <h3 class="tool-name">{{ item.name }}</h3>
                <el-tag :type="item.needLogin ? 'danger' : 'success'" size="small">
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </el-tag>
              </div>
            </template>
            <p class="tool-description">{{ item.description }}</p>
            <div class="card-footer-actions">
              <el-button type="primary" @click="openUrl(item.url)" size="small">
                立即访问
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// 导入Element Plus图标组件
import { ChatLineRound, Edit, Monitor, Picture, More } from '@element-plus/icons-vue';

// 导入AI工具核心逻辑
import { useAllAI } from '@/core/tools/AllAI';

// 使用AI工具组合式函数获取数据和方法
const {
  generalAI,    // 通用对话AI列表
  writingAI,    // 写作AI列表
  devAI,        // 开发AI列表
  artAI,        // 艺术AI列表
  otherAI,      // 其他AI列表
  openUrl       // 打开URL方法
} = useAllAI();

</script>

<style scoped>
/* PC端AI工具容器样式 */
.pc-ai-container {
  width: 100%;
  height: calc(100vh - 60px);
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;
}

/* AI工具卡片网格布局 */
.ai-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

/* AI工具卡片样式 */
.ai-tool-card {
  transition: all 0.3s ease;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* 卡片悬停效果 */
.ai-tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 需要登录的卡片特殊样式 */
.ai-tool-card.login-required {
  border-left: 4px solid #f56c6c;
}

/* 卡片头部内容布局 */
.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

/* 工具名称样式 */
.tool-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  line-height: 1.4;
}

/* 工具描述样式 */
.tool-description {
  color: #606266;
  font-size: 14px;
  margin: 12px 0;
  min-height: 42px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部操作区域 */
.card-footer-actions {
  margin-top: 15px;
  text-align: right;
}

/* 标签页样式优化 */
:deep(.el-tabs__header) {
  margin-bottom: 0;
  background: #fff;
  border-radius: 8px 8px 0 0;
}

:deep(.el-tabs__item) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.el-icon) {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pc-ai-container {
    padding: 15px;
  }

  .ai-cards-grid {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 15px 0;
  }

  .tool-name {
    font-size: 15px;
  }

  .tool-description {
    font-size: 13px;
    min-height: 36px;
  }
}

@media (max-width: 1200px) {
  .ai-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>