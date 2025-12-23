/**
 * SSE 实时通知服务
 * 用于接收后端推送的订单状态变更等通知
 */

import { ref, reactive } from 'vue'
import { getBackEndUrl } from '@/config/env.js'

// 通知状态
export const notificationState = reactive({
  connected: false,
  notifications: [],
  unreadCount: 0
})

// 状态映射
const statusMap = {
  PENDING: '待生产',
  IN_PROGRESS: '生产中',
  READY_TO_SHIP: '待发货',
  AWAITING_PAYMENT: '待收款',
  COMPLETED: '已完成'
}

let eventSource = null
let reconnectTimer = null
const MAX_NOTIFICATIONS = 50

/**
 * 连接SSE服务
 * @param {string} userId 用户ID
 */
export function connectSSE(userId = 'anonymous') {
  if (eventSource) {
    eventSource.close()
  }

  const baseUrl = getBackEndUrl()
  const url = `${baseUrl}/api/notifications/subscribe?userId=${userId}`

  try {
    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      notificationState.connected = true
      console.log('[SSE] 连接成功')
    }

    // 监听连接确认事件
    eventSource.addEventListener('connect', (event) => {
      console.log('[SSE] 收到连接确认:', event.data)
    })

    // 监听订单数据同步事件（实时更新其他客户端的数据）
    eventSource.addEventListener('order_sync', (event) => {
      try {
        const data = JSON.parse(event.data)
        // 触发自定义事件，让订单管理页面监听并更新数据
        window.dispatchEvent(new CustomEvent('order-sync', { detail: data }))
        
        // 如果状态发生变化，添加通知
        if (data.oldStatus && data.order && data.oldStatus !== data.order.status) {
          const notification = {
            id: Date.now(),
            type: 'order_status_change',
            title: '订单状态变更',
            message: `订单 ${data.order.orderNumber} 状态已从「${statusMap[data.oldStatus] || data.oldStatus}」变更为「${statusMap[data.order.status] || data.order.status}」`,
            data: data.order,
            time: new Date(),
            read: false
          }
          addNotification(notification)
        } else if (data.action === 'update' && data.order) {
          // 普通更新也添加通知
          const notification = {
            id: Date.now(),
            type: 'order_update',
            title: '订单数据更新',
            message: `订单 ${data.order.orderNumber} 的数据已被其他用户修改`,
            data: data.order,
            time: new Date(),
            read: false
          }
          addNotification(notification)
        }
      } catch (e) {
        console.error('[SSE] 解析订单同步消息失败:', e)
      }
    })

    // 监听样品数据同步事件
    eventSource.addEventListener('sample_sync', (event) => {
      try {
        const data = JSON.parse(event.data)
        // 触发自定义事件，让样品管理页面监听并更新数据
        window.dispatchEvent(new CustomEvent('sample-sync', { detail: data }))
        
        if (data.action === 'update' && data.sample) {
          const notification = {
            id: Date.now(),
            type: 'sample_update',
            title: '样品数据更新',
            message: `样品 ${data.sample.model} 的数据已被其他用户修改`,
            data: data.sample,
            time: new Date(),
            read: false
          }
          addNotification(notification)
        }
      } catch (e) {
        console.error('[SSE] 解析样品同步消息失败:', e)
      }
    })

    // 监听测试事件
    eventSource.addEventListener('test', (event) => {
      try {
        const data = JSON.parse(event.data)
        const notification = {
          id: Date.now(),
          type: 'test',
          title: '测试通知',
          message: data.content || '这是一条测试通知',
          data,
          time: new Date(),
          read: false
        }
        addNotification(notification)
      } catch (e) {
        console.error('[SSE] 解析测试消息失败:', e)
      }
    })

    eventSource.onerror = (error) => {
      console.error('[SSE] 连接错误:', error)
      notificationState.connected = false
      eventSource.close()
      // 5秒后重连
      reconnectTimer = setTimeout(() => connectSSE(userId), 5000)
    }
  } catch (e) {
    console.error('[SSE] 创建连接失败:', e)
    notificationState.connected = false
  }
}

/**
 * 断开SSE连接
 */
export function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  notificationState.connected = false
}

/**
 * 添加通知
 */
function addNotification(notification) {
  notificationState.notifications.unshift(notification)
  notificationState.unreadCount++
  
  // 限制通知数量
  if (notificationState.notifications.length > MAX_NOTIFICATIONS) {
    notificationState.notifications.pop()
  }
}

/**
 * 标记通知为已读
 */
export function markAsRead(notificationId) {
  const notification = notificationState.notifications.find(n => n.id === notificationId)
  if (notification && !notification.read) {
    notification.read = true
    notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1)
  }
}

/**
 * 标记所有通知为已读
 */
export function markAllAsRead() {
  notificationState.notifications.forEach(n => n.read = true)
  notificationState.unreadCount = 0
}

/**
 * 清空所有通知
 */
export function clearAllNotifications() {
  notificationState.notifications = []
  notificationState.unreadCount = 0
}
