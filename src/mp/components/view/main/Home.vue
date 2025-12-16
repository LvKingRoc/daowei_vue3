<template>
  <!-- 首页容器 -->
  <div class="home-container">
    <div class="welcome-content">
      <h1 class="welcome-title">您好，欢迎来到</h1>
      <h1 class="welcome-main-title">深圳市道威塑胶五金制品有限公司管理系统</h1>
      <h2 class="welcome-subtitle">请点击下方菜单进入系统</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
};
</script>

<style scoped>
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: #f7f8fa;
}

.welcome-content {
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.welcome-title {
  font-size: min(24px, 6vw);
  color: #4b5563;
  font-weight: normal;
  margin-bottom: 10px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

.welcome-main-title {
  font-size: min(28px, 7vw);
  color: #1d4ed8;
  font-weight: bold;
  margin-bottom: 24px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

.welcome-subtitle {
  font-size: min(16px, 5vw);
  color: #6b7280;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.6;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}
</style>
