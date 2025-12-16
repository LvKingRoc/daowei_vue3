// @ts-nocheck
import request from '@/core/utils/request';

// 样品相关 API 封装，对应后端 SampleController
// 使用 multipart/form-data 上传图片：字段名为 sample（JSON 字符串）和可选 image（文件）

// 内部工具：根据样品数据和图片文件构建 FormData
// sample: 一个普通的 JS 对象，对应后端的 Sample 实体主要字段
// file:   可选的图片文件（File 或 Blob），为空则表示不更新图片
// options.clearImage: 在编辑场景下，如果需要删除已有图片，可传入 { clearImage: true }
function buildSampleFormData(sample, file, options = {}) {
  const formData = new FormData();

  // 后端通过 @RequestPart("sample") String sampleJson 接收
  formData.append('sample', JSON.stringify(sample || {}));

  if (file) {
    // 有新图片文件时，携带 image 字段
    formData.append('image', file, file.name || 'image.jpg');
  } else if (options.clearImage) {
    // 兼容旧逻辑：通过一个空文件让后端判断并删除旧图片
    // （也可以在前端调用 DELETE /samples/{id}/image，见下方 deleteImage 方法）
    formData.append('image', new Blob([], { type: 'application/octet-stream' }), 'empty.bin');
  }

  return formData;
}

export const sampleApi = {
  // 获取样品列表（不分页）
  list() {
    return request.get('/samples');
  },

  // 分页获取样品列表
  getByPage(pageNum = 1, pageSize = 20) {
    return request.get('/samples/page', { pageNum, pageSize });
  },

  // 根据 ID 获取样品详情
  getById(id) {
    return request.get(`/samples/${id}`);
  },

  // 创建样品（可携带图片）
  create(sample, file) {
    const formData = buildSampleFormData(sample, file);
    return request.post('/samples', formData);
  },

  // 更新样品（可选择更新或删除图片）
  update(id, sample, file, options) {
    const formData = buildSampleFormData(sample, file, options);
    return request.put(`/samples/${id}`, formData);
  },

  // 删除样品
  remove(id) {
    return request.delete(`/samples/${id}`);
  },

  // 修复 customerId 为 null 的样品
  fixNullCustomers() {
    return request.post('/samples/fix-null-customers');
  },

  // 查询与样品关联的订单数量
  countOrders(id) {
    return request.get(`/samples/${id}/orders/count`);
  },

  // 删除指定样品的图片
  deleteImage(id) {
    return request.delete(`/samples/${id}/image`);
  }
};
