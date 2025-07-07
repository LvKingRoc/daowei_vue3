<template>
  <!-- 支持页面容器 -->
  <div class="support-container">
    <div class="support-content">
      <h2 class="support-title">感谢您的支持</h2>
      <div class="image-container">
        <img src="../../../assets/image/Support.jpg" alt="支持我们" class="support-image">
      </div>
      <p class="support-text">您的支持是我们前进的动力</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 可以根据需要添加特定的逻辑
</script>

<style scoped>
/* 支持页面容器样式 */
.support-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 95px);
  width: 100%;
  padding: 20px;
  background-color: #f5f5f5;
}

/* 支持内容样式 */
.support-content {
  text-align: center;
  max-width: 800px;
  width: 100%;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 支持标题样式 */
.support-title {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
}

/* 图片容器样式 */
.image-container {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

/* 支持图片样式 */
.support-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain; /* 保持图片比例 */
}

/* 支持文本样式 */
.support-text {
  margin-top: 20px;
  color: #666;
  font-size: 18px;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .support-content {
    padding: 20px;
  }

  .support-title {
    font-size: 24px;
  }

  .support-image {
    max-height: 300px;
  }
}
</style> 