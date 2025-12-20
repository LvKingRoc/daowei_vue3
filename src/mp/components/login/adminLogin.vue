<template>
  <div class="login">
    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    <div class="login-card">
      <div class="card-header">
        <h1 class="login-title">管理员登录</h1>
        <p class="login-subtitle">深圳市道威塑胶五金制品有限公司管理系统</p>
      </div>
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="账号"
            placeholder="请输入管理员账号"
            :rules="[{ required: true, message: '请填写账号' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div class="button-wrapper">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            color="linear-gradient(135deg, #8E2DE2, #4A00E0)"
          >
            登录
          </van-button>
        </div>
      </van-form>
      <div class="form-footer">
        <router-link class="switch-link" to="/login">切换到用户登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePlatformAuthStore as useMpAuthStore } from '@/stores/platformAuth';

const username = ref('');
const password = ref('');
const loading = ref(false);
const rememberPassword = ref(true);  // 移动端默认记住密码
const authStore = useMpAuthStore();

// localStorage 存储键名
const STORAGE_KEY = 'daowei_admin_login';

// 加载保存的登录信息
const loadSavedCredentials = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      username.value = data.username || '';
      password.value = data.password || '';
      rememberPassword.value = data.rememberPassword !== false;  // 默认为 true
    }
  } catch (e) {
    console.error('加载保存的登录信息失败:', e);
  }
};

// 保存登录信息（登录成功后调用）
const saveCredentials = () => {
  const data = {
    username: username.value,  // 始终保存用户名
    rememberPassword: rememberPassword.value
  };
  
  // 只有勾选“记住密码”时才保存密码
  if (rememberPassword.value) {
    data.password = password.value;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
          window.location.href = '/admin/home';
        } else {
          window.location.href = '/user/home';
        }
        return;
      }
    } catch (e) {
      console.error('Token校验失败:', e);
    }
    loading.value = false;
  }

  // 只记住账号密码，不自动登录
});

const onSubmit = async (values) => {
  loading.value = true;
  // 先保存凭据（因为login成功后会立即跳转页面）
  saveCredentials();
  
  await authStore.login({
    username: values.username,
    password: values.password,
    isAdmin: true
  });
  loading.value = false;
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%);
  position: relative;
  overflow: hidden;
  padding: 20px 16px;
}
.login-card {
  width: 100%;
  max-width: 360px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  padding: 24px 18px 20px;
  position: relative;
  z-index: 2;
}
.card-header {
  text-align: center;
  margin-bottom: 18px;
}
.login-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(45deg, #8E2DE2, #4A00E0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.login-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #7f8c8d;
}
.button-wrapper {
  margin-top: 18px;
}
.form-footer {
  margin-top: 14px;
  text-align: center;
  font-size: 13px;
}
.switch-link {
  color: #4A00E0;
  text-decoration: none;
}
.switch-link:active {
  opacity: 0.8;
}
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
  background: rgba(255, 255, 255, 0.12);
}
.circle-1 {
  width: 200px;
  height: 200px;
  top: -70px;
  left: -70px;
}
.circle-2 {
  width: 160px;
  height: 160px;
  bottom: -60px;
  right: -40px;
}
@media (max-width: 340px) {
  .login-card {
    padding: 20px 14px 18px;
  }
  .login-title {
    font-size: 20px;
  }
}
</style>
