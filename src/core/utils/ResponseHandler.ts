import { ElMessage, ElNotification } from 'element-plus';

/**
 * 统一API响应格式接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code: number;
}

/**
 * 响应处理选项
 */
export interface ResponseOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
  useNotification?: boolean;
}

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
  static handle<T = any>(
    response: ApiResponse<T>, 
    options: ResponseOptions = {}
  ): { success: boolean; data?: T; message?: string } {
    const {
      showSuccessMessage = false,
      showErrorMessage = true,
      successMessage,
      errorMessage,
      useNotification = false
    } = options;

    if (response.success) {
      // 成功响应处理
      if (showSuccessMessage) {
        const message = successMessage || response.message || '操作成功';
        this.showMessage(message, 'success', useNotification);
      }
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } else {
      // 错误响应处理
      if (showErrorMessage) {
        const message = errorMessage || response.message || '操作失败';
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
  static handleSuccess<T = any>(
    response: ApiResponse<T>,
    options: ResponseOptions = {}
  ): T | null {
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
    response: ApiResponse,
    options: ResponseOptions = {}
  ): string {
    const result = this.handle(response, { ...options, showErrorMessage: true });
    return result.message || '未知错误';
  }

  /**
   * 检查响应是否成功
   * @param response API响应对象
   * @returns 是否成功
   */
  static isSuccess(response: ApiResponse): boolean {
    return response.success === true && response.code === 200;
  }

  /**
   * 检查响应是否失败
   * @param response API响应对象
   * @returns 是否失败
   */
  static isError(response: ApiResponse): boolean {
    return !this.isSuccess(response);
  }

  /**
   * 显示消息
   * @param message 消息内容
   * @param type 消息类型
   * @param useNotification 是否使用通知
   */
  private static showMessage(
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    useNotification: boolean = false
  ): void {
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
  static showSuccess(message: string, useNotification: boolean = false): void {
    this.showMessage(message, 'success', useNotification);
  }

  /**
   * 显示错误消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showError(message: string, useNotification: boolean = false): void {
    this.showMessage(message, 'error', useNotification);
  }

  /**
   * 显示警告消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showWarning(message: string, useNotification: boolean = false): void {
    this.showMessage(message, 'warning', useNotification);
  }

  /**
   * 显示信息消息
   * @param message 消息内容
   * @param useNotification 是否使用通知
   */
  static showInfo(message: string, useNotification: boolean = false): void {
    this.showMessage(message, 'info', useNotification);
  }
}

/**
 * 便捷的响应处理函数
 */
export const handleResponse = ResponseHandler.handle;
export const handleSuccess = ResponseHandler.handleSuccess;
export const handleError = ResponseHandler.handleError;
export const isSuccess = ResponseHandler.isSuccess;
export const isError = ResponseHandler.isError;
export const showSuccess = ResponseHandler.showSuccess;
export const showError = ResponseHandler.showError;
export const showWarning = ResponseHandler.showWarning;
export const showInfo = ResponseHandler.showInfo;

export default ResponseHandler;
