import request from '@/core/utils/request';

// 用户相关 API 封装
export const userApi = {
  // 获取用户列表
  list() {
    return request.get('/user/findAll');
  },

  // 新增用户
  create(payload) {
    return request.post('/user/add', payload);
  },

  // 更新用户
  update(payload) {
    return request.put('/user/update', payload);
  },

  // 删除用户
  remove(id) {
    return request.delete(`/user/delete/${id}`);
  }
};
