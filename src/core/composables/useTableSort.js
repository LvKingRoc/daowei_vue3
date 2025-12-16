/**
 * 表格排序通用Composable
 * 提供表格排序相关的状态和方法
 */
import { ref, computed } from 'vue';

export function useTableSort() {
  // 排序列
  const sortColumn = ref('');
  // 排序顺序 ('ascending' | 'descending' | '')
  const sortOrder = ref('');

  /**
   * 处理排序变化（Element Plus表格事件）
   * @param {object} param0 包含prop和order的对象
   */
  const handleSortChange = ({ prop, order }) => {
    sortColumn.value = prop || '';
    sortOrder.value = order || '';
  };

  /**
   * 对数据进行排序
   * @param {Array} data 原始数据
   * @returns {Array} 排序后的数据
   */
  const sortData = (data) => {
    if (!sortColumn.value || !sortOrder.value) {
      return data;
    }

    const sorted = [...data];
    const { value: column } = sortColumn;
    const { value: order } = sortOrder;

    sorted.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      // 处理null和undefined
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      // 字符串比较时转小写
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      // 日期比较
      if (valueA instanceof Date) valueA = valueA.getTime();
      if (valueB instanceof Date) valueB = valueB.getTime();

      if (order === 'ascending') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    return sorted;
  };

  /**
   * 重置排序
   */
  const resetSort = () => {
    sortColumn.value = '';
    sortOrder.value = '';
  };

  /**
   * 检查是否有排序
   */
  const isSorted = computed(() => !!sortColumn.value && !!sortOrder.value);

  return {
    sortColumn,
    sortOrder,
    handleSortChange,
    sortData,
    resetSort,
    isSorted
  };
}

export default useTableSort;
