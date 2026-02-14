/**
 * pinyin.js 白盒测试
 * 覆盖拼音转换、首字母、模糊搜索、fuzzySearch 全部分支
 */
import { describe, it, expect } from 'vitest'
import { getPinyin, getPinyinInitials, matchesSearch, fuzzySearch } from '../pinyin.js'

// ==================== getPinyin ====================

describe('getPinyin', () => {
  it('中文转全拼', () => {
    expect(getPinyin('你好')).toBe('nihao')
  })

  it('空值返回空字符串', () => {
    expect(getPinyin('')).toBe('')
    expect(getPinyin(null)).toBe('')
    expect(getPinyin(undefined)).toBe('')
  })
})

// ==================== getPinyinInitials ====================

describe('getPinyinInitials', () => {
  it('中文转首字母', () => {
    expect(getPinyinInitials('你好')).toBe('nh')
  })

  it('空值返回空字符串', () => {
    expect(getPinyinInitials('')).toBe('')
    expect(getPinyinInitials(null)).toBe('')
  })
})

// ==================== matchesSearch ====================

describe('matchesSearch', () => {
  it('中文直接匹配', () => {
    expect(matchesSearch('道威公司', '道威')).toBe(true)
  })

  it('拼音全拼匹配', () => {
    expect(matchesSearch('道威公司', 'daowei')).toBe(true)
  })

  it('拼音首字母匹配', () => {
    expect(matchesSearch('道威公司', 'dwgs')).toBe(true)
  })

  it('不匹配返回false', () => {
    expect(matchesSearch('道威公司', 'xyz')).toBe(false)
  })

  it('空文本返回false', () => {
    expect(matchesSearch('', 'test')).toBe(false)
    expect(matchesSearch(null, 'test')).toBe(false)
  })

  it('空搜索词返回false', () => {
    expect(matchesSearch('道威', '')).toBe(false)
    expect(matchesSearch('道威', null)).toBe(false)
  })

  it('大小写不敏感', () => {
    expect(matchesSearch('道威公司', 'DaoWei')).toBe(true)
  })
})

// ==================== fuzzySearch ====================

describe('fuzzySearch', () => {
  it('空搜索词返回true（显示全部）', () => {
    expect(fuzzySearch('任意文本', '')).toBe(true)
    expect(fuzzySearch('任意文本', null)).toBe(true)
  })

  it('空源文本返回false', () => {
    expect(fuzzySearch('', '搜索')).toBe(false)
    expect(fuzzySearch(null, '搜索')).toBe(false)
  })

  it('原文直接匹配', () => {
    expect(fuzzySearch('道威公司', '道威')).toBe(true)
  })

  it('拼音全拼匹配', () => {
    expect(fuzzySearch('道威公司', 'daowei')).toBe(true)
  })

  it('拼音首字母匹配', () => {
    expect(fuzzySearch('道威公司', 'dwgs')).toBe(true)
  })

  it('不匹配返回false', () => {
    expect(fuzzySearch('道威公司', 'zzz')).toBe(false)
  })
})
