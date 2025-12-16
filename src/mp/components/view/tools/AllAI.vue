<template>
  <div class="tool-page">
    <!-- 头部 -->
    <div class="tool-hero">
      <div class="hero-icon">
        <van-icon name="fire-o" size="32" color="#ec4899" />
      </div>
      <h1>AI 工具合集</h1>
      <p>探索全球顶尖 AI</p>
    </div>

    <!-- 标签页 -->
    <div class="tabs-container">
      <van-tabs v-model:active="active" shrink line-width="20" line-height="3" color="#ec4899">
        <van-tab title="通用">
          <div class="ai-grid">
            <div v-for="item in generalAI" :key="item.name" class="ai-card" @click="openUrl(item.url)">
              <div class="card-icon" :style="{ background: getGradient(0) }">
                <van-icon name="chat-o" size="22" color="#fff" />
              </div>
              <div class="card-body">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="card-badge" :class="item.needLogin ? 'login' : 'free'">
                {{ item.needLogin ? '需登录' : '免费' }}
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="写作">
          <div class="ai-grid">
            <div v-for="item in writingAI" :key="item.name" class="ai-card" @click="openUrl(item.url)">
              <div class="card-icon" :style="{ background: getGradient(1) }">
                <van-icon name="edit" size="22" color="#fff" />
              </div>
              <div class="card-body">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="card-badge" :class="item.needLogin ? 'login' : 'free'">
                {{ item.needLogin ? '需登录' : '免费' }}
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="开发">
          <div class="ai-grid">
            <div v-for="item in devAI" :key="item.name" class="ai-card" @click="openUrl(item.url)">
              <div class="card-icon" :style="{ background: getGradient(2) }">
                <van-icon name="code-o" size="22" color="#fff" />
              </div>
              <div class="card-body">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="card-badge" :class="item.needLogin ? 'login' : 'free'">
                {{ item.needLogin ? '需登录' : '免费' }}
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="艺术">
          <div class="ai-grid">
            <div v-for="item in artAI" :key="item.name" class="ai-card" @click="openUrl(item.url)">
              <div class="card-icon" :style="{ background: getGradient(3) }">
                <van-icon name="photo-o" size="22" color="#fff" />
              </div>
              <div class="card-body">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="card-badge" :class="item.needLogin ? 'login' : 'free'">
                {{ item.needLogin ? '需登录' : '免费' }}
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="其他">
          <div class="ai-grid">
            <div v-for="item in otherAI" :key="item.name" class="ai-card" @click="openUrl(item.url)">
              <div class="card-icon" :style="{ background: getGradient(4) }">
                <van-icon name="apps-o" size="22" color="#fff" />
              </div>
              <div class="card-body">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="card-badge" :class="item.needLogin ? 'login' : 'free'">
                {{ item.needLogin ? '需登录' : '免费' }}
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAllAI } from '@/core/tools/AllAI';

const active = ref(0);

const {
  generalAI,
  writingAI,
  devAI,
  artAI,
  otherAI,
  openUrl
} = useAllAI();

const gradients = [
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
];

const getGradient = (index) => gradients[index % gradients.length];
</script>

<style scoped>
.tool-page {
  min-height: calc(100vh - 96px);
  background: #fff;
  padding-bottom: 20px;
}

/* 头部 */
.tool-hero {
  text-align: center;
  padding: 40px 20px 20px;
  background: linear-gradient(180deg, #fdf2f8 0%, #fff 100%);
}

.hero-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #fff;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
}

.tool-hero h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.tool-hero p {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

/* 标签页 */
.tabs-container {
  padding: 0 16px;
}

.tabs-container :deep(.van-tabs__nav) {
  background: transparent;
}

.tabs-container :deep(.van-tab) {
  font-size: 14px;
  color: #6b7280;
}

.tabs-container :deep(.van-tab--active) {
  color: #ec4899;
  font-weight: 500;
}

/* AI 卡片网格 */
.ai-grid {
  padding: 16px 0;
}

.ai-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  position: relative;
  transition: all 0.2s;
}

.ai-card:active {
  transform: scale(0.98);
  background: #fafafa;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 14px;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-body h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-body p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.card-badge.free {
  background: #ecfdf5;
  color: #059669;
}

.card-badge.login {
  background: #fef2f2;
  color: #dc2626;
}
</style>
