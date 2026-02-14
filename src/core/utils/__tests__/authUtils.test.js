/**
 * authUtils.js 白盒测试
 * 覆盖认证数据清除、登录路径获取的全部分支
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { clearAuthData, getLoginPath, clearAuthAndGetLoginPath } from '../authUtils.js'

describe('clearAuthData', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('清除token和role', () => {
    localStorage.setItem('token', 'test_token')
    localStorage.setItem('role', 'admin')
    localStorage.setItem('redirectAfterLogin', '/dashboard')

    clearAuthData()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('role')).toBeNull()
    expect(localStorage.getItem('redirectAfterLogin')).toBeNull()
  })

  it('不清除登录凭据', () => {
    localStorage.setItem('daowei_admin_login', '{"username":"admin"}')
    localStorage.setItem('token', 'test_token')

    clearAuthData()

    expect(localStorage.getItem('daowei_admin_login')).toBe('{"username":"admin"}')
  })
})

describe('getLoginPath', () => {
  it('admin角色返回管理员登录路径', () => {
    expect(getLoginPath('admin')).toBe('/admin/login')
  })

  it('user角色返回普通登录路径', () => {
    expect(getLoginPath('user')).toBe('/login')
  })

  it('其他角色返回普通登录路径', () => {
    expect(getLoginPath('unknown')).toBe('/login')
    expect(getLoginPath(null)).toBe('/login')
    expect(getLoginPath(undefined)).toBe('/login')
  })
})

describe('clearAuthAndGetLoginPath', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('清除认证并返回admin登录路径', () => {
    localStorage.setItem('token', 'test')
    const path = clearAuthAndGetLoginPath('admin')
    expect(path).toBe('/admin/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('清除认证并返回user登录路径', () => {
    localStorage.setItem('token', 'test')
    const path = clearAuthAndGetLoginPath('user')
    expect(path).toBe('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
