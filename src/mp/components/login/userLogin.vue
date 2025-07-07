<template>
  <div class="login">
    <el-card class="box-card">
      <div class="card-header">
        <h1 class="title">欢迎用户登录</h1>
        <span class="subtitle">深圳市道威塑胶五金制品有限公司</span>
      </div>
      <el-form label-position="top" :model="form" ref="formRef" @keyup.enter="login">
        <el-form-item label="账号" prop="username" :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]">
          <el-input v-model="form.username" placeholder="请输入您的账号" class="custom-input">
            <template #prefix>
              <i class="el-icon-user input-icon"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
          <el-input type="password" v-model="form.password" placeholder="请输入您的密码" class="custom-input" show-password>
            <template #prefix>
              <i class="el-icon-lock input-icon"></i>
            </template>
          </el-input>
        </el-form-item>

        <div class="button-group">
          <el-button type="primary" @click="login" class="login-btn" :loading="loading">登录</el-button>
          <el-button plain @click="adminLogin" class="admin-btn">管理员登录</el-button>
        </div>
      </el-form>
    </el-card>
    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/core/utils/request';
import { ResponseHandler } from '@/core/utils/ResponseHandler';

// 路由相关
const router = useRouter();
const route = useRoute();

// 响应式数据
const formRef = ref(null); // 表单引用
const loading = ref(false); // 登录加载状态

// 表单数据
const form = ref({
  username: '', // 用户账号
  password: ''  // 密码
});

// 登录方法
const login = async () => {
  try {
    // 表单验证
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    // 发送登录请求
    const res = await request.post('/user/login', {
      username: form.value.username,
      password: form.value.password
    });

    // 使用新的响应处理器
    const result = ResponseHandler.handle(res, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '用户登录成功',
      errorMessage: '登录失败，请检查用户名和密码'
    });

    if (result.success && result.data) {
      // 保存登录信息到本地存储
      localStorage.setItem('role', 'user');
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('userInfo', JSON.stringify(result.data.user));

      // 处理重定向或跳转到用户首页
      const redirect = route.query.redirect || '/user/home';
      router.push(redirect);
    }
  } catch (error) {
    // 网络错误或其他异常
    if (error.success === false) {
      ResponseHandler.handle(error, {
        showErrorMessage: true,
        errorMessage: '登录失败，请检查用户名和密码'
      });
    } else {
      ResponseHandler.showError('网络连接失败，请稍后再试');
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到管理员登录页面
const adminLogin = () => {
  router.push('/admin/login');
};
</script>

<style scoped>
/* 登录页面容器 */
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #00B4DB 0%, #0083B0 100%);
  position: relative;
  overflow: hidden;
}

/* 登录卡片样式 */
.box-card {
  width: 90%;
  max-width: 350px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: none;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 0;
}

/* 卡片头部样式 */
.card-header {
  text-align: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
}

/* 标题样式 */
.title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 5px 0;
  background: linear-gradient(45deg, #00B4DB, #0083B0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 副标题样式 */
.subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 表单样式 */
.el-form {
  padding: 0 20px;
}

.el-form-item {
  margin-bottom: 16px;
}

.el-form-item__label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
  display: block;
}

/* 自定义输入框样式 */
.custom-input {
  position: relative;
}

.custom-input .el-input__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6 !important;
  padding-left: 35px;
  height: 40px;
  transition: border-color 0.3s ease;
  font-size: 14px;
}

.custom-input .el-input__inner:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.el-input__inner {
  border: none !important;
}

.el-input {
  border: none !important;
}

/* 输入框图标样式 */
.input-icon {
  color: #7f8c8d;
  margin-left: 10px;
  font-size: 16px;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
  margin-bottom: 10px;
  width: 100%;
  align-items: center;
}

/* 按钮基础样式 */
.el-button {
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border: none;
  width: 90%;
  margin: 0 auto;
}

/* 登录按钮样式 */
.login-btn {
  background: linear-gradient(45deg, #00B4DB, #0083B0);
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(0, 180, 219, 0.3);
}

.login-btn:hover,
.login-btn:active {
  background: linear-gradient(45deg, #0083B0, #00B4DB);
  opacity: 0.9;
}

/* 管理员登录按钮样式 */
.admin-btn {
  background: transparent;
  color: #606266;
  font-size: 14px;
  border: 1px solid #dcdfe6;
}

.admin-btn:hover,
.admin-btn:active {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

/* 装饰元素样式 */
.decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -70px;
  left: -70px;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  right: -50px;
}

/* 针对小屏幕移动设备的额外调整 */
@media (max-width: 320px) {
  .title {
    font-size: 22px;
  }
  
  .subtitle {
    font-size: 12px;
  }
  
  .el-button {
    height: 38px;
    font-size: 15px;
  }
  
  .box-card {
    padding: 5px 0;
  }
  
  .el-form {
    padding: 0 15px;
  }
}
</style>