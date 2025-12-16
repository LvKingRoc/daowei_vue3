// @ts-nocheck
import request from '@/core/utils/request';

/**
 * 操作日志 API
 */
export const logApi = {
  /**
   * 分页获取日志列表
   * @param {number} pageNum 页码
   * @param {number} pageSize 每页数量
   */
  getList(pageNum = 1, pageSize = 20) {
    return request.get('/logs', { pageNum, pageSize });
  },

  /**
   * 条件搜索日志
   * @param {Object} params 搜索参数
   */
  search(params) {
    return request.get('/logs/search', params);
  },

  /**
   * 获取日志详情
   * @param {number} id 日志ID
   */
  getDetail(id) {
    return request.get(`/logs/${id}`);
  },

  /**
   * 清理旧日志
   * @param {number} days 保留天数
   */
  cleanOldLogs(days = 30) {
    return request.delete('/logs/clean', { days });
  }
};

export default logApi;
