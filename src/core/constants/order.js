/**
 * 订单相关常量
 */

// 订单状态枚举
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  COMPLETED: 'COMPLETED'
};

// 订单状态标签映射
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: '待处理',
  [ORDER_STATUS.IN_PROGRESS]: '生产中',
  [ORDER_STATUS.READY_TO_SHIP]: '待发货',
  [ORDER_STATUS.SHIPPED]: '已发货',
  [ORDER_STATUS.AWAITING_PAYMENT]: '待收款',
  [ORDER_STATUS.COMPLETED]: '已完成'
};

// 订单状态对应的标签类型（Element Plus Tag组件）
export const ORDER_STATUS_TAG_TYPES = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.IN_PROGRESS]: 'primary',
  [ORDER_STATUS.READY_TO_SHIP]: 'info',
  [ORDER_STATUS.SHIPPED]: 'success',
  [ORDER_STATUS.AWAITING_PAYMENT]: 'danger',
  [ORDER_STATUS.COMPLETED]: 'success'
};

// 订单状态对应的按钮类型
export const ORDER_STATUS_BUTTON_TYPES = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.IN_PROGRESS]: 'primary',
  [ORDER_STATUS.READY_TO_SHIP]: 'info',
  [ORDER_STATUS.SHIPPED]: 'success',
  [ORDER_STATUS.AWAITING_PAYMENT]: 'danger',
  [ORDER_STATUS.COMPLETED]: 'success'
};

/**
 * 获取订单状态标签
 * @param {string} status 订单状态
 * @returns {string} 状态标签
 */
export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || '未知状态';
}

/**
 * 获取订单状态标签类型
 * @param {string} status 订单状态
 * @returns {string} 标签类型
 */
export function getOrderStatusTagType(status) {
  return ORDER_STATUS_TAG_TYPES[status] || 'info';
}

/**
 * 获取订单状态按钮类型
 * @param {string} status 订单状态
 * @returns {string} 按钮类型
 */
export function getOrderStatusButtonType(status) {
  return ORDER_STATUS_BUTTON_TYPES[status] || 'info';
}

export default {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TAG_TYPES,
  ORDER_STATUS_BUTTON_TYPES,
  getOrderStatusLabel,
  getOrderStatusTagType,
  getOrderStatusButtonType
};
