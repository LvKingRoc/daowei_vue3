/**
 * 分页相关常量
 */

// 默认每页条数
export const DEFAULT_PAGE_SIZE = 10;

// 每页条数选项
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// 分页布局配置
export const PAGINATION_LAYOUT = 'total, sizes, prev, pager, next, jumper';

// 分页组件默认配置
export const PAGINATION_CONFIG = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizes: PAGE_SIZE_OPTIONS,
  layout: PAGINATION_LAYOUT,
  background: true,
  small: false
};

export default {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  PAGINATION_LAYOUT,
  PAGINATION_CONFIG
};
