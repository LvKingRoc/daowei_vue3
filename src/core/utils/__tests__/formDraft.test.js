/**
 * formDraft.js 白盒测试
 * 覆盖草稿保存/获取/检查/清除的全部分支：编辑模式、空数据、过期、异常
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveDraft, getDraft, hasDraft, getDraftInfo, clearDraft, clearExpiredDrafts } from '../formDraft.js'

describe('saveDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('正常保存草稿', () => {
    saveDraft('order', { name: '测试订单' }, { userId: 'u1' })
    const stored = JSON.parse(localStorage.getItem('form_draft_order_u1'))
    expect(stored.data).toEqual({ name: '测试订单' })
    expect(stored.timestamp).toBeDefined()
  })

  it('编辑模式不保存草稿', () => {
    saveDraft('order', { name: '测试' }, { isEdit: true })
    expect(localStorage.length).toBe(0)
  })

  it('空数据不保存草稿', () => {
    saveDraft('order', null)
    expect(localStorage.length).toBe(0)
  })

  it('空对象不保存草稿', () => {
    saveDraft('order', {})
    expect(localStorage.length).toBe(0)
  })

  it('所有字段为空值不保存草稿', () => {
    saveDraft('order', { a: null, b: '', c: undefined, d: [] })
    expect(localStorage.length).toBe(0)
  })

  it('至少一个字段有值才保存', () => {
    saveDraft('order', { a: null, b: '有内容' })
    expect(localStorage.length).toBe(1)
  })
})

describe('getDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('获取有效草稿', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now(), formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    const result = getDraft('order')
    expect(result).toEqual({ name: '测试' })
  })

  it('编辑模式返回null', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now(), formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    expect(getDraft('order', { isEdit: true })).toBeNull()
  })

  it('不存在的草稿返回null', () => {
    expect(getDraft('noexist')).toBeNull()
  })

  it('过期草稿返回null并清除', () => {
    const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000 // 25小时前
    const draft = { data: { name: '过期' }, timestamp: expiredTimestamp, formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    expect(getDraft('order')).toBeNull()
    expect(localStorage.getItem('form_draft_order_')).toBeNull()
  })

  it('JSON解析失败返回null', () => {
    localStorage.setItem('form_draft_order_', 'invalid_json{{{')
    expect(getDraft('order')).toBeNull()
  })
})

describe('hasDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('有有效草稿返回true', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now(), formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    expect(hasDraft('order')).toBe(true)
  })

  it('无草稿返回false', () => {
    expect(hasDraft('order')).toBe(false)
  })

  it('编辑模式返回false', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now(), formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    expect(hasDraft('order', { isEdit: true })).toBe(false)
  })
})

describe('getDraftInfo', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('返回草稿信息（含timeAgo）', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now() - 5 * 60000, formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    const info = getDraftInfo('order')
    expect(info).not.toBeNull()
    expect(info.formName).toBe('order')
    expect(info.timeAgo).toContain('分钟前')
  })

  it('刚刚保存的草稿', () => {
    const draft = { data: { name: '测试' }, timestamp: Date.now(), formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    const info = getDraftInfo('order')
    expect(info.timeAgo).toBe('刚刚')
  })

  it('过期草稿返回null', () => {
    const draft = { data: { name: '过期' }, timestamp: Date.now() - 25 * 3600000, formName: 'order' }
    localStorage.setItem('form_draft_order_', JSON.stringify(draft))

    expect(getDraftInfo('order')).toBeNull()
  })

  it('不存在返回null', () => {
    expect(getDraftInfo('noexist')).toBeNull()
  })

  it('JSON解析失败返回null', () => {
    localStorage.setItem('form_draft_order_', 'bad_json')
    expect(getDraftInfo('order')).toBeNull()
  })
})

describe('clearDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('清除指定草稿', () => {
    localStorage.setItem('form_draft_order_', '{}')
    clearDraft('order')
    expect(localStorage.getItem('form_draft_order_')).toBeNull()
  })

  it('带userId清除', () => {
    localStorage.setItem('form_draft_order_u1', '{}')
    clearDraft('order', { userId: 'u1' })
    expect(localStorage.getItem('form_draft_order_u1')).toBeNull()
  })
})

describe('clearExpiredDrafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('清除过期草稿，保留有效草稿', () => {
    // 有效草稿
    localStorage.setItem('form_draft_valid_', JSON.stringify({
      data: {}, timestamp: Date.now(), formName: 'valid'
    }))
    // 过期草稿
    localStorage.setItem('form_draft_expired_', JSON.stringify({
      data: {}, timestamp: Date.now() - 25 * 3600000, formName: 'expired'
    }))
    // 非草稿数据
    localStorage.setItem('other_key', 'keep')

    clearExpiredDrafts()

    expect(localStorage.getItem('form_draft_valid_')).not.toBeNull()
    expect(localStorage.getItem('form_draft_expired_')).toBeNull()
    expect(localStorage.getItem('other_key')).toBe('keep')
  })

  it('无效JSON数据会被清除', () => {
    localStorage.setItem('form_draft_bad_', 'invalid_json')

    clearExpiredDrafts()

    expect(localStorage.getItem('form_draft_bad_')).toBeNull()
  })
})
