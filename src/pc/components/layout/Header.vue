<template>
  <!-- 头部容器 -->
  <div class="header">
    <el-card class="header-card">
      <div class="header-content">
        <!-- 系统Logo -->

        <div class="logo">深圳市道威塑胶五金制品有限公司管理系统</div>
        <div class="header-right">
          <!-- 当前时间显示 -->
          <div 
            class="time-display" 
            @mouseenter="showCalendar = true"
            @click="toggleLockCalendar"
            ref="timeRef"
          >
            {{ currentTime }}
          </div>
          <!-- 日历悬浮窗 -->
          <div 
            v-show="showCalendar || lockCalendar" 
            class="calendar-popover"
            @mouseleave="handleMouseLeave"
            ref="calendarRef"
          >
            <div class="calendar-header">
              <div class="date-navigation">
                <div class="year-nav">
                  <el-button type="primary" text size="small" @click="changeYear(-1)">
                    <el-icon><ArrowLeft /></el-icon>
                  </el-button>
                  <el-select v-model="currentYear" size="small" @change="updateCalendar" class="year-select">
                    <el-option 
                      v-for="year in yearOptions" 
                      :key="year" 
                      :label="year + '年'" 
                      :value="year"
                    />
                  </el-select>
                  <el-button type="primary" text size="small" @click="changeYear(1)">
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>

                <div class="month-nav">
                  <el-button type="primary" text size="small" @click="changeMonth(-1)">
                    <el-icon><ArrowLeft /></el-icon>
                  </el-button>
                  <el-select v-model="currentMonth" size="small" @change="updateCalendar" class="month-select">
                    <el-option 
                      v-for="month in 12" 
                      :key="month" 
                      :label="month + '月'" 
                      :value="month"
                    />
                  </el-select>
                  <el-button type="primary" text size="small" @click="changeMonth(1)">
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
                
                <el-button type="primary" size="small" class="today-btn" @click="goToToday">今天</el-button>
              </div>
            </div>

            <!-- 星期表头 -->
            <div class="calendar-weekdays">
              <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday" :class="{ 'weekend': day === '日' }">
                {{ day }}
              </div>
            </div>

            <!-- 日历主体 -->
            <div class="calendar-body">
              <div 
                v-for="(day, index) in calendarDays" 
                :key="index"
                class="calendar-day"
                :class="{
                  'other-month': day.isOtherMonth,
                  'today': day.isToday,
                  'weekend': day.isWeekend
                }"
              >
                <div class="day-content" :class="{ 'weekend': day.isWeekend }">
                  <span class="solar-day" :class="{ 'festival-day': day.festivals.length > 0 }">{{ day.solarDay }}</span>
                  <span class="lunar-day" :class="{ 'festival': day.festivals.length > 0 }">
                    {{ day.festivals.length > 0 ? day.festivals[0] : day.lunarDay }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 今日信息 -->
            <div class="today-info" v-if="selectedDayData">
              <div class="info-section">
                <div class="info-row">
                  <span class="label">农历：</span>
                  <span class="api-text">{{ selectedDayData.nyue }}{{ selectedDayData.nri }}</span>
                </div>
                <div class="info-row">
                  <span class="label">季节：</span>
                  <span class="api-text">{{ selectedDayData.jijie }}</span>
                </div>
                <div class="info-row">
                  <span class="label">生肖：</span>
                  <span class="api-text">{{ selectedDayData.shengxiao }}</span>
                </div>
                <div class="info-row">
                  <span class="label">星座：</span>
                  <span class="api-text">{{ selectedDayData.xingzuo }}</span>
                </div>
                <div class="info-row">
                  <span class="label">相冲：</span>
                  <span class="api-text">{{ selectedDayData.xiangchong }}</span>
                </div>
                <div class="info-row">
                  <span class="label">干支：</span>
                  <span class="api-text">{{ selectedDayData.ganzhinian }} {{ selectedDayData.ganzhiyue }} {{ selectedDayData.ganzhiri }}</span>
                </div>
                <div class="info-row">
                  <span class="label">胎神：</span>
                  <span class="api-text">{{ selectedDayData.taishen }}</span>
                </div>
                <div class="info-row">
                  <span class="label">五行：</span>
                  <span class="api-text">{{ selectedDayData.nianwuxing }}年 {{ selectedDayData.yuewuxing }}月 {{ selectedDayData.riwuxing }}日</span>
                </div>
                <div class="info-row">
                  <span class="label">彭祖百忌：</span>
                  <span class="api-text">{{ selectedDayData.pengzu }}</span>
                </div>
                <div class="info-row" v-if="selectedDayData.jieqi">
                  <span class="label">节气：</span>
                  <span class="api-text">{{ selectedDayData.jieqimsg }}</span>
                </div>
                <div class="info-row" v-if="selectedDayData.jieri">
                  <span class="label">节日：</span>
                  <span class="api-text">{{ selectedDayData.jieri }}</span>
                </div>
                <div class="yi-ji-section">
                  <div class="yi-ji-row">
                    <span class="label">宜：</span>
                    <span class="api-text">{{ selectedDayData.yi }}</span>
                  </div>
                  <div class="yi-ji-row">
                    <span class="label">忌：</span>
                    <span class="api-text">{{ selectedDayData.ji }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 退出按钮 -->
          <el-button class="header-logout-btn" type="danger" @click="logout">退出</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { Lunar, Solar } from 'lunar-typescript';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import request from '@/core/utils/request';

// 获取农历信息
function getLunarInfo(date) {
  const solar = Solar.fromDate(date);
  const lunar = Lunar.fromDate(date);
  
  return {
    lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    festivals: [...lunar.getFestivals(), ...solar.getFestivals()],
  };
}

// 获取日历天数数组
function getCalendarDays(year, month) {
  const days = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const today = new Date();

  // 获取月初是星期几（0-6）
  const firstDayWeek = firstDay.getDay();

  // 添加上个月的天数
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 2, day);
    const lunarInfo = getLunarInfo(date);
    
    days.push({
      solarDay: day,
      lunarDay: lunarInfo.lunar.split('月')[1],
      isOtherMonth: true,
      isToday: false,
      isWeekend: date.getDay() === 0,
      isHoliday: lunarInfo.festivals.length > 0,
      isWorkday: false,
      festivals: lunarInfo.festivals
    });
  }

  // 添加当前月的天数
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month - 1, i);
    const lunarInfo = getLunarInfo(date);
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    days.push({
      solarDay: i,
      lunarDay: lunarInfo.lunar.split('月')[1],
      isOtherMonth: false,
      isToday,
      isWeekend: date.getDay() === 0,
      isHoliday: lunarInfo.festivals.length > 0,
      isWorkday: false,
      festivals: lunarInfo.festivals
    });
  }

  // 添加下个月的天数
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month, i);
    const lunarInfo = getLunarInfo(date);
    
    days.push({
      solarDay: i,
      lunarDay: lunarInfo.lunar.split('月')[1],
      isOtherMonth: true,
      isToday: false,
      isWeekend: date.getDay() === 0,
      isHoliday: lunarInfo.festivals.length > 0,
      isWorkday: false,
      festivals: lunarInfo.festivals
    });
  }

  return days;
}

// 定义props接收来自父组件的属性
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

const router = useRouter();
const currentTime = ref('');
const showCalendar = ref(false);
const lockCalendar = ref(false);
const calendarRef = ref(null);
const timeRef = ref(null);
const selectedDayData = ref(null);

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// 年份选项（1900-2200年）
const yearOptions = computed(() => {
  return Array.from({ length: 301 }, (_, i) => 1900 + i);
});

// 计算日历天数
const calendarDays = computed(() => {
  return getCalendarDays(currentYear.value, currentMonth.value);
});

// 更新当前时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 获取今日数据（通过后端代理）
const fetchTodayData = async () => {
  try {
    const response = await request.get('/proxy/calendar');
    
    if (response.success && response.data && response.data.code === 200) {
      selectedDayData.value = response.data;
      localStorage.setItem('calendarData', JSON.stringify(response.data));
    } else {
      console.error('API返回错误:', response);
      const cachedData = localStorage.getItem('calendarData');
      if (cachedData) {
        try {
          selectedDayData.value = JSON.parse(cachedData);
        } catch (error) {
          console.error('缓存数据解析失败:', error);
          selectedDayData.value = null;
        }
      } else {
        selectedDayData.value = null;
      }
    }
  } catch (error) {
    console.error('获取日历数据失败:', error);
    const cachedData = localStorage.getItem('calendarData');
    if (cachedData) {
      try {
        selectedDayData.value = JSON.parse(cachedData);
      } catch (error) {
        console.error('缓存数据解析失败:', error);
        selectedDayData.value = null;
      }
    } else {
      selectedDayData.value = null;
    }
  }
};

// 处理鼠标离开
const handleMouseLeave = () => {
  if (!lockCalendar.value) {
    showCalendar.value = false;
  }
};

// 切换日历锁定状态
const toggleLockCalendar = () => {
  lockCalendar.value = !lockCalendar.value;
  if (lockCalendar.value) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};

// 处理点击外部
const handleClickOutside = (event) => {
  const calendar = calendarRef.value;
  const timeDisplay = timeRef.value;
  
  if (calendar && timeDisplay && 
      !calendar.contains(event.target) && 
      !timeDisplay.contains(event.target)) {
    lockCalendar.value = false;
    showCalendar.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

import { clearAuthData, getLoginPath } from '@/core/utils/authUtils';

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const role = localStorage.getItem('role');
    clearAuthData();  // 使用统一的清除函数
    router.push(getLoginPath(role));
  });
};

// 更新日历
const updateCalendar = () => {
  // 更新日历视图
};

// 跳转到今天
const goToToday = () => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
  updateCalendar();
};

// 年月导航函数
const changeYear = (delta) => {
  currentYear.value += delta;
  updateCalendar();
};

const changeMonth = (delta) => {
  let newMonth = currentMonth.value + delta;
  if (newMonth > 12) {
    newMonth = 1;
    currentYear.value++;
  } else if (newMonth < 1) {
    newMonth = 12;
    currentYear.value--;
  }
  currentMonth.value = newMonth;
  updateCalendar();
};

let timer;
// 组件挂载时启动时间更新和获取日历数据
onMounted(() => {
  updateTime();
  fetchTodayData();
  timer = window.setInterval(() => {
    updateTime();
    // 不再在每天0点自动获取数据，而是在用户下次访问时才更新
  }, 1000);
});

// 组件销毁时清除定时器和事件监听
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 头部样式 */
.header {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  padding: 10px 0;
  background-color: #273550;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 头部卡片样式 */
.header-card {
  width: 100%;
  background-color: transparent;
  border: none;
  box-shadow: none;
}

/* 头部内容布局 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
}

/* Logo 样式 */
.logo {
  font-family: "思源黑体 CN Bold";
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 右侧内容布局 */
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

/* 时间显示样式 */
.time-display {
  font-size: 20px;
  font-family: "SF Mono", "Consolas", monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 时间显示悬停效果 */
.time-display:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.time-display:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 1px;
  background: #fff;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.time-display:hover:after {
  width: calc(100% - 20px);
  opacity: 0.3;
}

/* 退出按钮样式 */
.header-logout-btn {
  width: 80px;
  height: 36px;
  padding: 0;
  background-color: #e74c3c;
  border: none;
  transition: all 0.3s ease;
}

/* 退出按钮悬停效果 */
.header-logout-btn:hover {
  transform: scale(1.05);
  background-color: #c0392b;
}

/* 新增日历悬浮窗样式 */
.calendar-popover {
  width: 500px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  position: fixed;
  top: 70px;
  right: 100px;
  z-index: 9999;
  color: #333;

  .calendar-header {
    margin-bottom: 12px;

    .date-navigation {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      .year-nav, .month-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .year-select {
          width: 100px;
        }
        
        .month-select {
          width: 80px;
        }
      }

      :deep(.el-input__wrapper) {
        padding: 0 8px;
        background-color: transparent;
        box-shadow: none !important;
      }

      :deep(.el-input__inner) {
        color: #333;
        font-size: 14px;
        font-weight: 500;
      }

      :deep(.el-select-dropdown__item) {
        padding: 0 12px;
        height: 32px;
        line-height: 32px;
      }

      :deep(.el-button) {
        height: 32px;
        padding: 0 8px;
        border: none;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        .el-icon {
          font-size: 16px;
        }
      }

      .today-btn {
        min-width: 60px;
        height: 32px;
        padding: 0 16px;
        font-weight: 500;
      }
    }
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 4px;

    .weekday {
      padding: 4px 0;
      font-size: 14px;
      color: #333;

      &:first-child {
        color: #ff4d4f;
      }
    }
  }

  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: #f0f0f0;
    padding: 1px;

    .calendar-day {
      aspect-ratio: auto;
      height: 54px;
      max-width: 70px;
      background: white;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f5f7fa;
      }

      .day-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2px;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;

        .solar-day {
          font-size: 14px;
          line-height: 1.2;
          color: #333;
          margin-bottom: 2px;
          width: 100%;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lunar-day {
          font-size: 12px;
          color: #999;
          line-height: 1.2;
          width: 100%;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 2px;
          max-width: 60px;
        }

        &.weekend .solar-day,
        .festival-day {
          color: #ff4d4f;
        }

        .lunar-day.festival {
          color: #ff4d4f;
        }
      }

      &.other-month {
        .solar-day {
          color: #ccc;
        }
        .lunar-day {
          color: #ccc;
        }
        &.weekend .solar-day {
          color: #ffb4b4;
        }
      }

      &.today {
        background-color: #e6f7ff;
        border: 1px solid #1890ff;
      }
    }
  }

  .today-info {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #eee;

    .info-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .info-row {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          color: #666;
          font-size: 13px;
        }

        .api-text {
          color: #1890ff;
          font-size: 14px;
        }
      }

      .yi-ji-section {
        grid-column: 1 / -1;
        background: #f8f9fa;
        padding: 12px;
        border-radius: 4px;
        margin-top: 8px;

        .yi-ji-row {
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}
</style>