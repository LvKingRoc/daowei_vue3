<template>
  <div class="login">
    <el-card class="box-card">
      <div class="card-header">
        <h1 class="title">欢迎用户登录</h1>
        <span class="subtitle">深圳市道威塑胶五金制品有限公司管理系统</span>
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

        <div class="login-options">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
          <el-checkbox v-model="autoLogin">自动登录</el-checkbox>
        </div>

        <div class="button-group">
          <el-button plain @click="adminLogin" class="admin-btn">管理员登录</el-button>
          <el-button type="primary" @click="login" class="login-btn" :loading="loading">登录</el-button>
        </div>
      </el-form>
    </el-card>
    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

// 路由相关
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 响应式数据
const formRef = ref(null); // 表单引用
const loading = ref(false); // 登录加载状态
const rememberPassword = ref(false); // 记住密码
const autoLogin = ref(false); // 自动登录

// localStorage 存储键名
const STORAGE_KEY = 'daowei_pc_user_login';

// 表单数据
const form = ref({
  username: '', // 用户账号
  password: ''  // 密码
});

// 加载保存的登录信息
const loadSavedCredentials = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      form.value.username = data.username || '';
      form.value.password = data.password || '';
      rememberPassword.value = data.rememberPassword || false;
      autoLogin.value = data.autoLogin || false;
    }
  } catch (e) {
    console.error('加载保存的登录信息失败:', e);
  }
};

// 保存登录信息
const saveCredentials = () => {
  if (rememberPassword.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      username: form.value.username,
      password: form.value.password,
      rememberPassword: rememberPassword.value,
      autoLogin: autoLogin.value
    }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// 页面加载时检查 token 是否有效
onMounted(async () => {
  // 加载保存的登录信息
  loadSavedCredentials();

  const token = localStorage.getItem('token');
  if (token) {
    // 校验 token
    loading.value = true;
    try {
      const result = await authStore.verifyToken();
      if (result.valid) {
        // token 有效，根据角色跳转
        if (result.role === 'admin') {
          router.replace('/admin/home');
        } else {
          router.replace('/user/home');
        }
        return;
      }
    } catch (e) {
      console.error('Token校验失败:', e);
    }
    loading.value = false;
  }

  // 如果启用了自动登录且有保存的凭据，自动执行登录
  if (autoLogin.value && form.value.username && form.value.password) {
    login();
  }
});

// 登录方法
const login = async () => {
  try {
    // 表单验证
    const valid = await formRef.value.validate();
    if (!valid) return;

    // 保存登录信息
    saveCredentials();

    // 使用PC端auth store进行登录
    const success = await authStore.login({
      username: form.value.username,
      password: form.value.password,
      isAdmin: false
    });

    if (success) {
      ElMessage.success('用户登录成功');
    }
  } catch (error) {
    console.error('登录失败:', error);
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
  width: 420px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: none;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.box-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
}

/* 卡片头部样式 */
.card-header {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

/* 标题样式 */
.title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  background: linear-gradient(45deg, #00B4DB, #0083B0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 副标题样式 */
.subtitle {
  font-size: 16px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 表单样式 */
.el-form {
  padding: 0 25px;
}

.el-form-item {
  margin-bottom: 25px;
}

.el-form-item__label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: block;
}

/* 自定义输入框样式 */
.custom-input {
  position: relative;
}

.custom-input .el-input__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6 !important;
  padding-left: 40px;
  height: 46px;
  transition: border-color 0.3s ease;
}

.custom-input .el-input__inner:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.custom-input .el-input__inner::before,
.custom-input .el-input__inner::after {
  content: none;
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

/* 登录选项样式 */
.login-options {
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
  margin-bottom: 10px;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
}

/* 按钮基础样式 */
.el-button {
  height: 46px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border: none;
}

/* 登录按钮样式 */
.login-btn {
  background: linear-gradient(45deg, #00B4DB, #0083B0);
  color: white;
  flex: 2;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(0, 180, 219, 0.3);
}

.login-btn:hover {
  background: linear-gradient(45deg, #0083B0, #00B4DB);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 180, 219, 0.5);
}

/* 管理员登录按钮样式 */
.admin-btn {
  flex: 1;
  background: transparent;
  color: #606266;
  font-size: 14px;
  border: 1px solid #dcdfe6;
}

.admin-btn:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
  transform: translateY(-1px);
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
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: 100px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 150px;
  right: -50px;
}

/* 消息提示样式 */
.success-message {
  background-color: #2ecc71 !important;
  color: white !important;
  border-radius: 8px !important;
}

.error-message {
  background-color: #e74c3c !important;
  color: white !important;
  border-radius: 8px !important;
}
</style>
