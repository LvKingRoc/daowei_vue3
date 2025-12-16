// @ts-nocheck
import request from '@/core/utils/request';

// 员工相关 API 封装，对应后端 EmployeeController

export const employeeApi = {
  // 获取员工列表
  list() {
    return request.get('/employees');
  },

  // 根据 ID 获取员工详情
  getById(id) {
    return request.get(`/employees/${id}`);
  },

  // 新增员工
  create(payload) {
    return request.post('/employees', payload);
  },

  // 更新员工
  update(id, payload) {
    return request.put(`/employees/${id}`, payload);
  },

  // 删除员工
  remove(id) {
    return request.delete(`/employees/${id}`);
  }
};
