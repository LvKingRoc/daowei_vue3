/**
 * common.js 白盒测试
 * 覆盖日期处理、字符串处理、数值处理、API响应、存储、深拷贝等全部分支
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatDate, formatDateTime, getToday, getTodayArray,
  emptyText, maskPhone, maskIdCard, formatIdCard, getAgeFromIdCard,
  formatAmount, formatNumber,
  isApiSuccess, getApiErrorMsg,
  getStorage, setStorage, removeStorage,
  deepClone, generateId
} from '../common.js'

// ==================== 日期处理 ====================

describe('formatDate', () => {
  it('正常日期格式化', () => {
    expect(formatDate('2026-01-15')).toBe('2026-01-15')
  })

  it('自定义格式', () => {
    expect(formatDate('2026-01-15', 'YYYY/MM/DD')).toBe('2026/01/15')
  })

  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('正常日期时间格式化', () => {
    const result = formatDateTime('2026-01-15T10:30:00')
    expect(result).toContain('2026-01-15')
    expect(result).toContain('10:30:00')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime('')).toBe('')
  })
})

describe('getToday', () => {
  it('返回今天的日期字符串', () => {
    const today = getToday()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getTodayArray', () => {
  it('返回[年, 月, 日]数组', () => {
    const arr = getTodayArray()
    expect(arr).toHaveLength(3)
    expect(arr[0]).toMatch(/^\d{4}$/)
    expect(arr[1]).toMatch(/^\d{2}$/)
    expect(arr[2]).toMatch(/^\d{2}$/)
  })
})

// ==================== 字符串处理 ====================

describe('emptyText', () => {
  it('null返回默认文本', () => {
    expect(emptyText(null)).toBe('无')
  })

  it('undefined返回默认文本', () => {
    expect(emptyText(undefined)).toBe('无')
  })

  it('空字符串返回默认文本', () => {
    expect(emptyText('')).toBe('无')
  })

  it('自定义默认文本', () => {
    expect(emptyText(null, '暂无数据')).toBe('暂无数据')
  })

  it('有值返回字符串形式', () => {
    expect(emptyText('测试')).toBe('测试')
    expect(emptyText(123)).toBe('123')
    expect(emptyText(0)).toBe('0')
  })
})

describe('maskPhone', () => {
  it('正常手机号脱敏', () => {
    expect(maskPhone('13800138000')).toBe('138****8000')
  })

  it('短号码不脱敏', () => {
    expect(maskPhone('123456')).toBe('123456')
  })

  it('空值返回空字符串', () => {
    expect(maskPhone(null)).toBe('')
    expect(maskPhone('')).toBe('')
  })
})

describe('maskIdCard', () => {
  it('正常身份证脱敏', () => {
    expect(maskIdCard('110101199001011234')).toBe('110101********1234')
  })

  it('非18位不脱敏', () => {
    expect(maskIdCard('1234')).toBe('1234')
  })

  it('空值返回空字符串', () => {
    expect(maskIdCard(null)).toBe('')
    expect(maskIdCard('')).toBe('')
  })
})

describe('formatIdCard', () => {
  it('正常格式化', () => {
    expect(formatIdCard('110101199001011234')).toBe('110101 19900101 1234')
  })

  it('非18位不格式化', () => {
    expect(formatIdCard('1234')).toBe('1234')
  })

  it('空值返回空字符串', () => {
    expect(formatIdCard(null)).toBe('')
  })
})

describe('getAgeFromIdCard', () => {
  it('正常计算年龄', () => {
    const currentYear = new Date().getFullYear()
    expect(getAgeFromIdCard('110101199001011234')).toBe(currentYear - 1990)
  })

  it('非18位返回0', () => {
    expect(getAgeFromIdCard('1234')).toBe(0)
  })

  it('空值返回0', () => {
    expect(getAgeFromIdCard(null)).toBe(0)
  })
})

// ==================== 数值处理 ====================

describe('formatAmount', () => {
  it('正常格式化', () => {
    expect(formatAmount(1234.5)).toBe('1234.50')
  })

  it('自定义小数位', () => {
    expect(formatAmount(1234.567, 3)).toBe('1234.567')
  })

  it('null返回0.00', () => {
    expect(formatAmount(null)).toBe('0.00')
  })

  it('undefined返回0.00', () => {
    expect(formatAmount(undefined)).toBe('0.00')
  })
})

describe('formatNumber', () => {
  it('千分位格式化', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('小数字不加逗号', () => {
    expect(formatNumber(999)).toBe('999')
  })

  it('null返回0', () => {
    expect(formatNumber(null)).toBe('0')
  })
})

// ==================== API响应处理 ====================

describe('isApiSuccess', () => {
  it('success:true, code:200 返回true', () => {
    expect(isApiSuccess({ success: true, code: 200 })).toBe(true)
  })

  it('success:true, 无code 返回true', () => {
    expect(isApiSuccess({ success: true })).toBe(true)
  })

  it('success:true, code:null 返回true', () => {
    expect(isApiSuccess({ success: true, code: null })).toBe(true)
  })

  it('success:false 返回false', () => {
    expect(isApiSuccess({ success: false, code: 400 })).toBe(false)
  })

  it('null响应返回false', () => {
    expect(isApiSuccess(null)).toBe(false)
  })

  it('success:true, code:400 返回false', () => {
    expect(isApiSuccess({ success: true, code: 400 })).toBe(false)
  })

  it('success:true, code为非数字字符串 返回true', () => {
    expect(isApiSuccess({ success: true, code: 'abc' })).toBe(true)
  })
})

describe('getApiErrorMsg', () => {
  it('有message返回message', () => {
    expect(getApiErrorMsg({ message: '密码错误' })).toBe('密码错误')
  })

  it('无message返回默认值', () => {
    expect(getApiErrorMsg({})).toBe('操作失败')
  })

  it('自定义默认值', () => {
    expect(getApiErrorMsg(null, '请求失败')).toBe('请求失败')
  })
})

// ==================== 存储相关 ====================

describe('getStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('获取JSON对象', () => {
    localStorage.setItem('test', JSON.stringify({ a: 1 }))
    expect(getStorage('test')).toEqual({ a: 1 })
  })

  it('不存在返回默认值', () => {
    expect(getStorage('nokey', 'default')).toBe('default')
  })

  it('非JSON字符串返回原始值', () => {
    localStorage.setItem('str', 'hello')
    expect(getStorage('str')).toBe('hello')
  })
})

describe('setStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('设置对象（JSON序列化）', () => {
    setStorage('obj', { a: 1 })
    expect(localStorage.getItem('obj')).toBe('{"a":1}')
  })

  it('设置字符串', () => {
    setStorage('str', 'hello')
    expect(localStorage.getItem('str')).toBe('hello')
  })
})

describe('removeStorage', () => {
  it('移除存储项', () => {
    localStorage.setItem('toremove', 'value')
    removeStorage('toremove')
    expect(localStorage.getItem('toremove')).toBeNull()
  })
})

// ==================== 深拷贝 ====================

describe('deepClone', () => {
  it('深拷贝对象', () => {
    const obj = { a: 1, b: { c: 2 } }
    const clone = deepClone(obj)
    expect(clone).toEqual(obj)
    expect(clone).not.toBe(obj)
    expect(clone.b).not.toBe(obj.b)
  })

  it('null返回null', () => {
    expect(deepClone(null)).toBeNull()
  })

  it('基本类型直接返回', () => {
    expect(deepClone(123)).toBe(123)
    expect(deepClone('str')).toBe('str')
  })

  it('数组深拷贝', () => {
    const arr = [1, { a: 2 }]
    const clone = deepClone(arr)
    expect(clone).toEqual(arr)
    expect(clone[1]).not.toBe(arr[1])
  })
})

// ==================== generateId ====================

describe('generateId', () => {
  it('生成唯一ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })
})
