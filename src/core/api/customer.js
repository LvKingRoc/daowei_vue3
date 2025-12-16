// @ts-nocheck
import request from '@/core/utils/request';

// 客户相关 API 封装，对应后端 CustomerController
// 这里采用纯 JavaScript 写法，不定义类型接口，方便日后调整字段

export const customerApi = {
  // 获取客户列表（不含保留 ID 过滤，调用方可以自行过滤掉保留客户）
  list() {
    return request.get('/customers');
  },

  // 根据 ID 获取客户详情
  getById(id) {
    return request.get(`/customers/${id}`);
  },

  // 新增客户
  create(payload) {
    return request.post('/customers', payload);
  },

  // 更新客户
  update(id, payload) {
    return request.put(`/customers/${id}`, payload);
  },

  // 删除客户
  remove(id) {
    return request.delete(`/customers/${id}`);
  },

  // 统计某客户关联的样品数量
  countSamples(id) {
    return request.get(`/customers/${id}/samples/count`);
  },

  // 统计某客户关联的订单数量
  countOrders(id) {
    return request.get(`/customers/${id}/orders/count`);
  }
};
