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
/* 首页容器样式 */
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden; /* 防止内容溢出 */
}

/* 欢迎内容样式 */
.welcome-content {
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

/* 欢迎标题样式 */
.welcome-title {
  font-size: min(24px, 6vw);
  color: #555;
  font-weight: normal;
  margin-bottom: 10px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

/* 主标题样式 */
.welcome-main-title {
  font-size: min(28px, 7vw);
  color: #1a5276;
  font-weight: bold;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}

/* 副标题样式 */
.welcome-subtitle {
  font-size: min(16px, 5vw);
  color: #666;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.6;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 100%;
}
</style>
