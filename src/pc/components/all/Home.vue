<template>
  <!-- 首页容器 -->
  <div class="home-container">
    <div class="welcome-content">
      <h1 class="welcome-title">您好，欢迎来到</h1>
      <h1 class="welcome-main-title">深圳市道威塑胶五金制品有限公司管理系统</h1>
      <h2 class="welcome-subtitle">请点击左侧菜单栏进入系统</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
// 可以根据需要添加特定的逻辑
</script>

<style scoped>
/* 首页容器样式 */
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 95px);
  width: 100%;
  padding: 20px;
  position: relative;
}

/* 欢迎内容样式 */
.welcome-content {
  text-align: center;
  max-width: 800px;
}

/* 欢迎标题样式 */
.welcome-title {
  font-size: 32px;
  color: #555;
  font-weight: normal;
  margin-bottom: 10px;
}

/* 主标题样式 */
.welcome-main-title {
  font-size: 42px;
  color: #1a5276;
  font-weight: bold;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 副标题样式 */
.welcome-subtitle {
  font-size: 18px;
  color: #666;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.6;
}
</style> 