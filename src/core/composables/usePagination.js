/**
 * 分页通用Composable
 * 提供分页相关的状态和方法
 */
import { ref, computed } from 'vue';

export function usePagination(initialPageSize = 10) {
  // 当前页码
  const currentPage = ref(1);
  // 每页条数
  const pageSize = ref(initialPageSize);
  // 总条数
  const total = ref(0);
  // 跳转页码输入
  const jumpPage = ref('');

  // 计算偏移量
  const offset = computed(() => (currentPage.value - 1) * pageSize.value);

  // 计算总页数
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

  /**
   * 处理页码变化
   * @param {number} page 新页码
   */
  const handlePageChange = (page) => {
    currentPage.value = page;
  };

  /**
   * 处理每页条数变化
   * @param {number} size 新的每页条数
   */
  const handleSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
  };

  /**
   * 跳转到指定页
   */
  const handleJumpPage = () => {
    const page = Number(jumpPage.value);
    if (!page || page < 1 || page > totalPages.value) {
      return false;
    }
    currentPage.value = page;
    jumpPage.value = '';
    return true;
  };

  /**
   * 重置分页
   */
  const resetPagination = () => {
    currentPage.value = 1;
    jumpPage.value = '';
  };

  /**
   * 设置总条数
   * @param {number} count 总条数
   */
  const setTotal = (count) => {
    total.value = count;
  };

  /**
   * 对数据进行分页切片
   * @param {Array} data 原始数据
   * @returns {Array} 当前页的数据
   */
  const paginate = (data) => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return data.slice(start, end);
  };

  return {
    currentPage,
    pageSize,
    total,
    jumpPage,
    offset,
    totalPages,
    handlePageChange,
    handleSizeChange,
    handleJumpPage,
    resetPagination,
    setTotal,
    paginate
  };
}

export default usePagination;
