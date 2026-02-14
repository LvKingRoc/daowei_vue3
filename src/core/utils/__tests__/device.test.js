/**
 * device.js 白盒测试
 * 覆盖平台检测全部分支：PC/移动端/强制模式/缓存
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { detectPlatform, getPlatform, isMobileDevice } from '../device.js'

describe('detectPlatform', () => {
  beforeEach(() => {
    // 重置强制标志和缓存
    delete window.forcePcVersion
    delete window.forceMobileVersion
    delete window.__APP_PLATFORM__
  })

  it('桌面端浏览器返回pc', () => {
    // jsdom 默认 userAgent 不含移动端关键词，且 innerWidth > 768
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    expect(detectPlatform()).toBe('pc')
  })

  it('forcePcVersion为true强制返回pc', () => {
    window.forcePcVersion = true
    expect(detectPlatform()).toBe('pc')
  })

  it('forceMobileVersion为true强制返回mp', () => {
    window.forceMobileVersion = true
    expect(detectPlatform()).toBe('mp')
  })

  it('窄屏幕返回mp', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true })
    expect(detectPlatform()).toBe('mp')
  })
})

describe('getPlatform', () => {
  beforeEach(() => {
    delete window.__APP_PLATFORM__
    delete window.forcePcVersion
    delete window.forceMobileVersion
  })

  it('首次调用会缓存结果', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    const result = getPlatform()
    expect(result).toBe('pc')
    expect(window.__APP_PLATFORM__).toBe('pc')
  })

  it('已缓存时直接返回缓存值', () => {
    window.__APP_PLATFORM__ = 'mp'
    expect(getPlatform()).toBe('mp')
  })
})

describe('isMobileDevice', () => {
  beforeEach(() => {
    delete window.__APP_PLATFORM__
  })

  it('PC端返回false', () => {
    window.__APP_PLATFORM__ = 'pc'
    expect(isMobileDevice()).toBe(false)
  })

  it('移动端返回true', () => {
    window.__APP_PLATFORM__ = 'mp'
    expect(isMobileDevice()).toBe(true)
  })
})
