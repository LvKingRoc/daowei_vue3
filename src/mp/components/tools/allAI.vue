<!-- 移动端AI工具集合组件 -->
<template>
  <div class="mobile-ai-collection">
    <!-- AI工具标签页 -->
    <van-tabs sticky swipeable animated>
      <!-- 通用对话AI标签页 -->
      <van-tab title="通用对话">
        <div class="ai-tab-content">
          <van-cell-group
            inset
            v-for="item in generalAI"
            :key="item.name"
            class="ai-tool-group"
          >
            <van-cell
              :title="item.name"
              :label="item.description"
              class="tool-info-cell"
            >
              <template #right-icon>
                <van-tag
                  :type="item.needLogin ? 'danger' : 'success'"
                  size="medium"
                  class="login-status-tag"
                >
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell class="action-cell">
              <template #default>
                <van-button
                  type="primary"
                  block
                  @click="openUrl(item.url)"
                  class="access-button"
                >
                  立即访问
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>

      <!-- 写作AI标签页 -->
      <van-tab title="写作AI">
        <div class="ai-tab-content">
          <van-cell-group
            inset
            v-for="item in writingAI"
            :key="item.name"
            class="ai-tool-group"
          >
            <van-cell
              :title="item.name"
              :label="item.description"
              class="tool-info-cell"
            >
              <template #right-icon>
                <van-tag
                  :type="item.needLogin ? 'danger' : 'success'"
                  size="medium"
                  class="login-status-tag"
                >
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell class="action-cell">
              <template #default>
                <van-button
                  type="primary"
                  block
                  @click="openUrl(item.url)"
                  class="access-button"
                >
                  立即访问
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>

      <!-- 开发AI标签页 -->
      <van-tab title="开发AI">
        <div class="ai-tab-content">
          <van-cell-group
            inset
            v-for="item in devAI"
            :key="item.name"
            class="ai-tool-group"
          >
            <van-cell
              :title="item.name"
              :label="item.description"
              class="tool-info-cell"
            >
              <template #right-icon>
                <van-tag
                  :type="item.needLogin ? 'danger' : 'success'"
                  size="medium"
                  class="login-status-tag"
                >
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell class="action-cell">
              <template #default>
                <van-button
                  type="primary"
                  block
                  @click="openUrl(item.url)"
                  class="access-button"
                >
                  立即访问
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>

      <!-- 艺术AI标签页 -->
      <van-tab title="艺术AI">
        <div class="ai-tab-content">
          <van-cell-group
            inset
            v-for="item in artAI"
            :key="item.name"
            class="ai-tool-group"
          >
            <van-cell
              :title="item.name"
              :label="item.description"
              class="tool-info-cell"
            >
              <template #right-icon>
                <van-tag
                  :type="item.needLogin ? 'danger' : 'success'"
                  size="medium"
                  class="login-status-tag"
                >
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell class="action-cell">
              <template #default>
                <van-button
                  type="primary"
                  block
                  @click="openUrl(item.url)"
                  class="access-button"
                >
                  立即访问
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>

      <!-- 其他AI标签页 -->
      <van-tab title="其他AI">
        <div class="ai-tab-content">
          <van-cell-group
            inset
            v-for="item in otherAI"
            :key="item.name"
            class="ai-tool-group"
          >
            <van-cell
              :title="item.name"
              :label="item.description"
              class="tool-info-cell"
            >
              <template #right-icon>
                <van-tag
                  :type="item.needLogin ? 'danger' : 'success'"
                  size="medium"
                  class="login-status-tag"
                >
                  {{ item.needLogin ? '需登录' : '免登录' }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell class="action-cell">
              <template #default>
                <van-button
                  type="primary"
                  block
                  @click="openUrl(item.url)"
                  class="access-button"
                >
                  立即访问
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
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
/* 移动端AI工具集合容器样式 */
.mobile-ai-collection {
  padding: 0;
  background: #f7f8fa;
  min-height: 100vh;
}

/* AI标签页内容区域 */
.ai-tab-content {
  padding: 16px;
  background: #f7f8fa;
}

/* AI工具组样式 */
.ai-tool-group {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: #ffffff;
}

/* 工具信息单元格样式 */
.tool-info-cell {
  padding: 16px !important;
  background: #ffffff;
}

/* 操作单元格样式 */
.action-cell {
  padding: 12px 16px 16px 16px !important;
  background: #ffffff;
  border-top: 1px solid #f2f3f5;
}

/* 登录状态标签样式 */
.login-status-tag {
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* 访问按钮样式 */
.access-button {
  border-radius: 8px;
  font-weight: 600;
  height: 40px;
  font-size: 15px;
}

/* 深度样式覆盖 */
:deep(.van-cell__title) {
  font-weight: 600;
  font-size: 16px;
  color: #323233;
  line-height: 1.4;
}

:deep(.van-cell__label) {
  color: #646566;
  font-size: 14px;
  margin-top: 6px;
  line-height: 1.5;
  word-break: break-all;
}

:deep(.van-cell__right-icon) {
  margin-left: 12px;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.3);
}

:deep(.van-button--primary:active) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

:deep(.van-tabs__wrap) {
  position: sticky;
  top: 0;
  z-index: 99;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.van-tab) {
  font-weight: 500;
  font-size: 14px;
  color: #646566;
}

:deep(.van-tab--active) {
  color: #1989fa;
  font-weight: 600;
}

:deep(.van-tabs__line) {
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  height: 3px;
  border-radius: 2px;
}

:deep(.van-tabs__content) {
  background: #f7f8fa;
}

/* 响应式优化 */
@media (max-width: 375px) {
  .ai-tab-content {
    padding: 12px;
  }

  .ai-tool-group {
    margin-bottom: 12px;
  }

  .tool-info-cell {
    padding: 14px !important;
  }

  .action-cell {
    padding: 10px 14px 14px 14px !important;
  }

  :deep(.van-cell__title) {
    font-size: 15px;
  }

  :deep(.van-cell__label) {
    font-size: 13px;
  }
}
</style>