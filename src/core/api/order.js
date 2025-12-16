// @ts-nocheck
import request from '@/core/utils/request';

// 订单相关 API 封装，对应后端 OrderController

export const orderApi = {
  // 获取订单列表
  list() {
    return request.get('/orders');
  },

  // 根据 ID 获取订单详情
  getById(id) {
    return request.get(`/orders/${id}`);
  },

  // 创建订单
  create(payload) {
    return request.post('/orders', payload);
  },

  // 更新订单
  update(id, payload) {
    return request.put(`/orders/${id}`, payload);
  },

  // 删除订单
  remove(id) {
    return request.delete(`/orders/${id}`);
  }
};
