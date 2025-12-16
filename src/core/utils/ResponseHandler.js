// @ts-nocheck
import { ElMessage, ElNotification } from 'element-plus';

/**
 * 统一API响应格式接口
 * 示例结构：{ success: boolean, message?: string, data?: any, code: number }
 * 这里只作为注释说明，不再使用 TypeScript 接口。
 */
// ApiResponse: { success: boolean; message?: string; data?: any; code: number }

/**
 * 响应处理选项
 * 示例结构：{ showSuccessMessage?: boolean, showErrorMessage?: boolean, useNotification?: boolean }
 * 注意：消息内容完全由后端返回，前端不再硬编码
 */
// ResponseOptions: { showSuccessMessage?: boolean; showErrorMessage?: boolean; useNotification?: boolean }

/**
 * 响应处理器类
 */
export class ResponseHandler {
  /**
   * 处理API响应
   * @param response API响应对象
   * @param options 处理选项
   * @returns 处理结果
   */
  static handle(
    response,
    options = {}
  ) {
    const {
      showSuccessMessage = false,
      showErrorMessage = true,
      useNotification = false
    } = options;

    if (this.isSuccess(response)) {
      // 成功响应处理 - 消息完全由后端返回
      if (showSuccessMessage) {
        const message = response.message || '操作成功';
        this.showMessage(message, 'success', useNotification);
      }
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } else {
      // 错误响应处理 - 消息完全由后端返回
      if (showErrorMessage) {
        const message = response.message || '操作失败，请检查网络';
        this.showMessage(message, 'error', useNotification);
      }
      
      return {
        success: false,
        message: response.message
      };
    }
  }

  /**
   * 处理成功响应
   * @param response API响应对象
   * @param options 处理选项
   * @returns 数据或null
   */
  static handleSuccess(
    response,
    options = {}
  ) {
    const result = this.handle(response, options);
    return result.success ? result.data || null : null;
  }

  /**
   * 处理错误响应
   * @param response API响应对象
   * @param options 处理选项
   * @returns 错误信息
   */
  static handleError(
    response,
    options = {}
  ) {
    const result = this.handle(response, { ...options, showErrorMessage: true });
    return result.message || '未知错误';
  }

  /**
   * 检查响应是否成功
   * @param response API响应对象
   * @returns 是否成功
   */
  static isSuccess(response) {
    if (!response || response.success !== true) return false;
    if (response.code === undefined || response.code === null) return true;
    const code = Number(response.code);
    if (Number.isNaN(code)) return true;
    return code >= 200 && code < 300;
  }

  /**
   * 检查响应是否失败
   * @param response API响应对象
   * @returns 是否失败
   */
  static isError(response) {
    return !this.isSuccess(response);
  }

  /**
   * 显示消息
   * @param message 消息内容
   * @param type 消息类型
   * @param useNotification 是否使用通知
   */
  static showMessage(
    message,
    type = 'info',
    useNotification = false
  ) {
    if (useNotification) {
      // 使用通知
      if (typeof ElNotification !== 'undefined') {
        ElNotification({
          title: type === 'success' ? '成功' : type === 'error' ? '错误' : '提示',
          message,
          type,
          duration: type === 'error' ? 5000 : 3000
        });
      } else {
        // 降级到消息提示
        this.showMessage(message, type, false);
      }
    } else {
      // 使用消息提示
      if (typeof ElMessage !== 'undefined') {
        ElMessage({
          message,
          type,
          duration: type === 'error' ? 5000 : 3000
        });
      } else {
        // 降级到alert
        alert(message);
      }
    }
  }

  /**
   * 显示成功消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showSuccess(message, useNotification = false) {
    this.showMessage(message, 'success', useNotification);
  }

  /**
   * 显示错误消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showError(message, useNotification = false) {
    this.showMessage(message, 'error', useNotification);
  }

  /**
   * 显示警告消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showWarning(message, useNotification = false) {
    this.showMessage(message, 'warning', useNotification);
  }

  /**
   * 显示信息消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showInfo(message, useNotification = false) {
    this.showMessage(message, 'info', useNotification);
  }
}

/**
 * 便捷的响应处理函数
 * 使用包装函数确保在调用静态方法时 this 始终指向 ResponseHandler 本身，
 * 避免直接导出未绑定的静态方法引用导致 this 为 undefined 的问题。
 */
export const handleResponse = (response, options) =>
  ResponseHandler.handle(response, options);

export const handleSuccess = (response, options) =>
  ResponseHandler.handleSuccess(response, options);

export const handleError = (response, options) =>
  ResponseHandler.handleError(response, options);

export const isSuccess = (response) =>
  ResponseHandler.isSuccess(response);

export const isError = (response) =>
  ResponseHandler.isError(response);

export const showSuccess = (message, useNotification) =>
  ResponseHandler.showSuccess(message, useNotification);

export const showError = (message, useNotification) =>
  ResponseHandler.showError(message, useNotification);

export const showWarning = (message, useNotification) =>
  ResponseHandler.showWarning(message, useNotification);

export const showInfo = (message, useNotification) =>
  ResponseHandler.showInfo(message, useNotification);

export default ResponseHandler;
