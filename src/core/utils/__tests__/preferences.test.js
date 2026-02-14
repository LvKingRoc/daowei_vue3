/**
 * preferences.js 白盒测试
 * 覆盖偏好设置的获取/保存/重置/清除全部分支
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPreferences, savePreferences, getPreference,
  setPreference, resetPreferences, clearPreferences
} from '../preferences.js'

describe('getPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('无存储时返回默认偏好', () => {
    const prefs = getPreferences()
    expect(prefs.theme).toBe('light')
    expect(prefs.pageSize).toBe(20)
    expect(prefs.listView).toBe('card')
  })

  it('有存储时合并默认值', () => {
    localStorage.setItem('daowei_user_preferences', JSON.stringify({ theme: 'dark' }))
    const prefs = getPreferences()
    expect(prefs.theme).toBe('dark')
    expect(prefs.pageSize).toBe(20) // 默认值保留
  })

  it('JSON解析失败返回默认值', () => {
    localStorage.setItem('daowei_user_preferences', 'bad_json{{{')
    const prefs = getPreferences()
    expect(prefs.theme).toBe('light')
  })
})

describe('savePreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('保存偏好并合并已有设置', () => {
    savePreferences({ theme: 'dark' })
    const stored = JSON.parse(localStorage.getItem('daowei_user_preferences'))
    expect(stored.theme).toBe('dark')
    expect(stored.pageSize).toBe(20)
  })

  it('多次保存合并', () => {
    savePreferences({ theme: 'dark' })
    savePreferences({ pageSize: 50 })
    const stored = JSON.parse(localStorage.getItem('daowei_user_preferences'))
    expect(stored.theme).toBe('dark')
    expect(stored.pageSize).toBe(50)
  })

  it('成功返回true', () => {
    expect(savePreferences({ theme: 'dark' })).toBe(true)
  })
})

describe('getPreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('获取已存储的单个偏好', () => {
    savePreferences({ theme: 'dark' })
    expect(getPreference('theme')).toBe('dark')
  })

  it('获取不存在的偏好返回默认值', () => {
    expect(getPreference('pageSize')).toBe(20)
  })
})

describe('setPreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('设置单个偏好', () => {
    setPreference('theme', 'dark')
    expect(getPreference('theme')).toBe('dark')
  })
})

describe('resetPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('重置为默认值', () => {
    savePreferences({ theme: 'dark', pageSize: 50 })
    resetPreferences()
    const prefs = getPreferences()
    expect(prefs.theme).toBe('light')
    expect(prefs.pageSize).toBe(20)
  })

  it('成功返回true', () => {
    expect(resetPreferences()).toBe(true)
  })
})

describe('clearPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('清除偏好设置', () => {
    savePreferences({ theme: 'dark' })
    clearPreferences()
    expect(localStorage.getItem('daowei_user_preferences')).toBeNull()
  })

  it('成功返回true', () => {
    expect(clearPreferences()).toBe(true)
  })
})
