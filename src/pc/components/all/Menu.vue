<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { API_KEYS, EXTERNAL_APIS } from '@/config/env.ts';

// ========== 组件属性 ==========
// 接收父组件传递的认证状态和角色
const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: 'user'
  }
});

// ========== 路由相关 ==========
const router = useRouter();
const route = useRoute();
const currentRole = localStorage.getItem('role') || 'user'; // 当前登录角色

// ========== 天气相关 ==========
const weatherData = ref(null); // 当前天气数据
const forecastData = ref(null); // 天气预报数据
const loading = ref(true); // 天气加载状态
const showForecast = ref(false); // 是否显示天气预报弹窗

/**
 * 获取天气数据（当前+预报）
 */
const fetchWeather = async () => {
  try {
    loading.value = true;
    // 确保API密钥存在
    if (!API_KEYS.WEATHER_API_KEY) {
      console.error('天气API密钥未设置');
      return;
    }
    // 并发请求当前天气和预报
    const [current, forecast] = await Promise.all([
      axios.get(`${EXTERNAL_APIS.WEATHER_API.BASE_URL}?city=${EXTERNAL_APIS.WEATHER_API.CITY_CODE}&key=${API_KEYS.WEATHER_API_KEY}&extensions=base`),
      axios.get(`${EXTERNAL_APIS.WEATHER_API.BASE_URL}?city=${EXTERNAL_APIS.WEATHER_API.CITY_CODE}&key=${API_KEYS.WEATHER_API_KEY}&extensions=all`)
    ]);
    if (current.data.status === '1' && current.data.lives?.length > 0) {
      weatherData.value = current.data.lives[0];
    }
    if (forecast.data.status === '1' && forecast.data.forecasts?.length > 0) {
      forecastData.value = forecast.data.forecasts[0];
    }
  } catch (error) {
    console.error('获取天气数据失败:', error);
    weatherData.value = null;
    forecastData.value = null;
  } finally {
    loading.value = false;
  }
};

/**
 * 将日期字符串格式化为星期
 * @param {string} dateStr 日期字符串
 * @returns {string} 星期几
 */
const formatDate = dateStr => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(dateStr).getDay()];

// 组件挂载时获取天气，并定时刷新
onMounted(() => {
  fetchWeather();
  setInterval(fetchWeather, 30 * 60 * 1000); // 每30分钟刷新一次
});

// ========== 菜单相关 ==========
/**
 * 计算菜单项（根据路由和角色过滤）
 */
const menuItems = computed(() =>
  router.options.routes
    .filter(route => !route.meta?.hiddenInMenu && !route.hidden && (!route.meta?.role || route.meta.role === currentRole))
    .map(route => ({
      title: route.meta?.title || route.name,
      path: route.path,
      children: route.children
        ?.filter(child => !child.meta?.hiddenInMenu && !child.hidden)
        .map(child => ({
          title: child.meta?.title || child.name,
          path: `${route.path}/${child.path}`
        })) || []
    }))
);

const expandedItems = ref([]); // 当前展开的父菜单索引
const hoveredItems = ref([]); // 当前鼠标悬停的父菜单索引
const activePath = computed(() => route.path); // 当前激活路由路径

/**
 * 计算当前激活的父菜单索引
 */
const activeParentIndex = computed(() => {
  return menuItems.value.findIndex(item => 
    item.children.some(child => child.path === activePath.value)
  );
});

// 监听路由变化，自动展开当前激活的父菜单
watch(activePath, () => {
  const parentIndex = activeParentIndex.value;
  if (parentIndex !== -1 && !expandedItems.value.includes(parentIndex)) {
    expandedItems.value = [...expandedItems.value, parentIndex];
  }
});

/**
 * 菜单点击事件，展开/收起父菜单或跳转
 */
const handleMenuClick = (item, index) => {
  if (item.children.length) {
    if (expandedItems.value.includes(index)) {
      // 已展开则收起
      expandedItems.value = expandedItems.value.filter(i => i !== index);
    } else {
      // 未展开则展开
      expandedItems.value = [...expandedItems.value, index];
      hoveredItems.value = hoveredItems.value.filter(i => i !== index);
    }
  } else {
    router.push(item.path);
  }
};

/**
 * 鼠标移入父菜单，临时展开
 */
const handleMenuMouseEnter = (index) => {
  if (!expandedItems.value.includes(index)) {
    hoveredItems.value = [...hoveredItems.value, index];
  }
};

/**
 * 鼠标移出父菜单，收起临时展开
 */
const handleMenuMouseLeave = (index) => {
  hoveredItems.value = hoveredItems.value.filter(i => i !== index);
};
</script>

<template>
  <aside class="sidebar">
    <ul class="menu-container">
      <li v-for="(item, index) in menuItems" :key="item.path"
        :class="['menu-item', { 'has-children': item.children.length, 'active': item.path === activePath }]"
        @mouseleave="handleMenuMouseLeave(index)">
        <div class="menu-title" 
          @click="handleMenuClick(item, index)"
          @mouseenter="handleMenuMouseEnter(index)">
          {{ item.title }}
          <span v-if="item.children.length" class="arrow">
            {{ (expandedItems.includes(index) || hoveredItems.includes(index)) ? '▼' : '▶' }}
          </span>
        </div>
        <transition name="slide">
          <ul v-if="item.children.length && (expandedItems.includes(index) || hoveredItems.includes(index))" class="submenu">
            <li v-for="child in item.children" :key="child.path"
              :class="['submenu-item', { 'active': child.path === activePath }]">
              <router-link :to="child.path">{{ child.title }}</router-link>
            </li>
          </ul>
        </transition>
      </li>
    </ul>

    <!-- 天气组件移到这里，作为菜单的最后一项 -->
    <div class="weather-box" @mouseenter="showForecast = true" @mouseleave="showForecast = false">
      <div v-if="loading" class="weather-loading">加载中...</div>
      <div v-else-if="weatherData" class="weather-content">
        <div class="weather-header">
          <div class="location">📍 {{ weatherData.city }}</div>
        </div>
        <div class="weather-info">
          <div class="temp-box">
            <div class="temp">{{ weatherData.temperature }}°</div>
            <div class="desc">{{ weatherData.weather }}</div>
          </div>
          <div class="detail">
            <div>{{ weatherData.winddirection }}风 {{ weatherData.windpower }}级</div>
            <div>湿度 {{ weatherData.humidity }}%</div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- 将天气预报弹窗放在body中，确保它始终在最顶层 -->
  <teleport to="body">
    <div v-if="showForecast && weatherData && forecastData" class="forecast-popup">
      <div class="current">
        <div class="big-temp">{{ weatherData.temperature }}°</div>
        <div class="info">
          <div class="type">{{ weatherData.weather }}</div>
          <div class="range">{{ forecastData.casts[0].nighttemp }}° ~ {{ forecastData.casts[0].daytemp }}°</div>
        </div>
      </div>
      <div class="forecast-list">
        <div v-for="(cast, index) in forecastData.casts.slice(0, 3)" :key="index" class="forecast-item">
          <div class="date">{{ index === 0 ? '今天' : formatDate(cast.date) }}</div>
          <div class="icon">{{ cast.dayweather.includes('雨') ? '🌧️' : '⛅' }}</div>
          <div class="temp">{{ cast.nighttemp }}° ~ {{ cast.daytemp }}°</div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.sidebar {
  width: 220px;
  height: calc(100vh - 95px);
  background: #2d3a4b;
  color: #fff;
  position: fixed;
  left: 0;
  top: 95px;
  overflow-y: auto;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.menu-container {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.menu-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.05);
}

.menu-title {
  font-size: 20px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: 0.3s;
}

.menu-title:hover {
  background: rgba(255, 255, 255, 0.05);
}

.arrow {
  font-size: 12px;
}

.submenu {
  list-style: none;
  padding: 0;
  background: rgba(0, 0, 0, 0.2);
}

.submenu-item {
  padding: 10px 20px 10px 40px;
}

.submenu-item.active {
  background: rgba(255, 255, 255, 0.05);
}

.submenu-item a {
  color: #eee;
  text-decoration: none;
  display: block;
  transition: 0.3s;
}

.submenu-item a:hover {
  color: #fff;
  text-indent: 5px;
}

.slide-enter-active,
.slide-leave-active {
  transition: 0.3s;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.weather-box {
  position: relative;
  /* 改为相对定位，不再固定在底部 */
  margin: 10px 8px;
  /* 添加上下外边距 */
  background: #2c3e50;
  padding: 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
  z-index: 1000;
}

.weather-box:hover {
  background: #34495e;
}

.weather-loading {
  color: #ecf0f1;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}

.weather-content {
  color: #ecf0f1;
}

.weather-header {
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(236, 240, 241, 0.1);
  padding-bottom: 8px;
}

.location {
  font-size: 14px;
  color: #3498db;
}

.weather-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.temp-box {
  flex: 1;
}

.temp {
  font-size: 36px;
  line-height: 1;
  margin-bottom: 8px;
  color: #ecf0f1;
}

.desc {
  font-size: 14px;
  color: #3498db;
}

.detail {
  text-align: right;
  font-size: 12px;
  color: #bdc3c7;
  background: rgba(52, 152, 219, 0.1);
  padding: 8px 12px;
  border-radius: 4px;
}

.detail>div {
  margin: 4px 0;
}

.forecast-popup {
  position: fixed;
  left: 240px;
  bottom: 60px;
  width: 300px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  z-index: 999999;
  color: #333;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.current {
  display: flex;
  align-items: flex-start;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.big-temp {
  font-size: 52px;
  font-weight: 300;
  line-height: 1;
  margin-right: 20px;
}

.info {
  flex: 1;
  padding-top: 8px;
}

.type {
  font-size: 18px;
  margin-bottom: 6px;
  color: #2c3e50;
}

.range {
  font-size: 15px;
  color: #666;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-item {
  display: grid;
  grid-template-columns: 60px 40px 1fr;
  align-items: center;
  font-size: 15px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: 0.2s;
}

.forecast-item:hover {
  background: rgba(44, 62, 80, 0.05);
}

.forecast-item .date {
  color: #2c3e50;
  font-weight: 500;
}

.forecast-item .icon {
  font-size: 22px;
  text-align: center;
}

.forecast-item .temp {
  color: #666;
  text-align: right;
  padding-right: 10px;
}
</style>