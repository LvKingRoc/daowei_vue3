/**
 * 弹窗通用Composable
 * 提供弹窗相关的状态和方法
 */
import { ref, reactive } from 'vue';

/**
 * 创建弹窗Composable
 * @param {Function} getDefaultData 获取默认表单数据的函数
 * @returns {Object} 弹窗相关的状态和方法
 */
export function useDialog(getDefaultData = () => ({})) {
  // 弹窗可见性
  const visible = ref(false);
  // 表单引用
  const formRef = ref(null);
  // 表单数据
  const formData = reactive(getDefaultData());
  // 加载状态
  const loading = ref(false);

  /**
   * 打开弹窗
   * @param {Object} data 初始数据（可选）
   */
  const open = (data = null) => {
    resetForm();
    if (data) {
      Object.assign(formData, data);
    }
    visible.value = true;
  };

  /**
   * 关闭弹窗
   */
  const close = () => {
    visible.value = false;
    loading.value = false;
  };

  /**
   * 重置表单数据
   */
  const resetForm = () => {
    const defaultData = getDefaultData();
    Object.keys(formData).forEach(key => {
      if (key in defaultData) {
        formData[key] = defaultData[key];
      } else {
        delete formData[key];
      }
    });
    Object.keys(defaultData).forEach(key => {
      if (!(key in formData)) {
        formData[key] = defaultData[key];
      }
    });
    // 重置表单验证
    if (formRef.value?.resetFields) {
      formRef.value.resetFields();
    }
  };

  /**
   * 验证表单
   * @returns {Promise<boolean>} 验证结果
   */
  const validate = async () => {
    if (!formRef.value?.validate) {
      return true;
    }
    try {
      await formRef.value.validate();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * 设置加载状态
   * @param {boolean} state 加载状态
   */
  const setLoading = (state) => {
    loading.value = state;
  };

  /**
   * 判断是否为编辑模式
   */
  const isEditMode = () => {
    return formData.id != null;
  };

  return {
    visible,
    formRef,
    formData,
    loading,
    open,
    close,
    resetForm,
    validate,
    setLoading,
    isEditMode
  };
}

export default useDialog;
