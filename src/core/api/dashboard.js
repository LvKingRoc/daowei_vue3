// @ts-nocheck
import request from '@/core/utils/request';

// 仪表盘 / 统计相关 API 封装，对应后端 DashboardController

export const dashboardApi = {
  // 示例：获取汇总统计数据（具体路径可根据后端再调）
  summary() {
    return request.get('/dashboard');
  }
};
