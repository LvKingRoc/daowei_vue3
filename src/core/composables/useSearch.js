/**
 * 搜索功能通用Composable
 * 提供搜索相关的状态和方法
 */
import { reactive, computed } from 'vue';
import { matchesSearch } from '@/core/utils/pinyin';

/**
 * 创建搜索Composable
 * @param {Object} initialState 初始搜索状态
 * @param {Function} resetCallback 重置时的回调函数
 * @returns {Object} 搜索相关的状态和方法
 */
export function useSearch(initialState = {}, resetCallback = null) {
  // 搜索状态
  const searchState = reactive({ ...initialState });

  /**
   * 重置搜索条件
   */
  const resetSearch = () => {
    Object.keys(initialState).forEach(key => {
      searchState[key] = initialState[key];
    });
    if (resetCallback) {
      resetCallback();
    }
  };

  /**
   * 检查是否有搜索条件
   */
  const hasSearchCriteria = computed(() => {
    return Object.values(searchState).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  });

  /**
   * 根据搜索条件过滤数据
   * @param {Array} data 原始数据
   * @param {Object} fieldMapping 字段映射 { searchField: dataField }
   * @returns {Array} 过滤后的数据
   */
  const filterData = (data, fieldMapping = {}) => {
    if (!hasSearchCriteria.value) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(searchState).every(([searchKey, searchValue]) => {
        if (!searchValue) return true;
        
        const dataField = fieldMapping[searchKey] || searchKey;
        const itemValue = item[dataField];
        
        if (itemValue == null) return false;
        
        // 使用拼音搜索
        return matchesSearch(itemValue, searchValue);
      });
    });
  };

  /**
   * 更新搜索条件
   * @param {string} key 搜索字段
   * @param {any} value 搜索值
   */
  const updateSearch = (key, value) => {
    if (key in searchState) {
      searchState[key] = value;
    }
  };

  return {
    searchState,
    resetSearch,
    hasSearchCriteria,
    filterData,
    updateSearch
  };
}

export default useSearch;
