import pinyin from 'pinyin'

/**
 * 获取文本的拼音 (全拼)
 * @param {string} text 输入文本
 * @returns {string} 全拼拼音
 */
export const getPinyin = (text) => {
  if (!text) return ''
  return pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('')
}

/**
 * 获取文本的拼音首字母
 * @param {string} text 输入文本
 * @returns {string} 拼音首字母
 */
export const getPinyinInitials = (text) => {
  if (!text) return ''
  return pinyin(text, { style: pinyin.STYLE_FIRST_LETTER, heteronym: false }).flat().join('')
}

/**
 * 文本模糊搜索函数，支持中文、拼音全拼和首字母
 * @param {string} text 源文本
 * @param {string} searchTerm 搜索词
 * @returns {boolean} 是否匹配
 */
export const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return false

  const searchLower = String(searchTerm).toLowerCase()
  const textLower = String(text).toLowerCase()

  return (
    textLower.includes(searchLower) ||
    getPinyin(text).toLowerCase().includes(searchLower) ||
    getPinyinInitials(text).toLowerCase().includes(searchLower)
  )
}

/**
 * 通用模糊搜索函数，支持中文、拼音全拼和首字母
 * 与部分组件中原本的 fuzzySearch 逻辑保持一致
 * @param {string} source 源文本
 * @param {string} term 搜索词
 * @returns {boolean} 是否匹配
 */
export const fuzzySearch = (source, term) => {
  if (!term) return true
  if (!source) return false

  const sourceText = String(source).toLowerCase()
  const searchTerm = String(term).toLowerCase()

  // 1. 原文直接匹配
  if (sourceText.includes(searchTerm)) return true

  // 2. 拼音全拼匹配
  const pinyinText = getPinyin(source).toLowerCase()
  if (pinyinText.includes(searchTerm)) return true

  // 3. 拼音首字母匹配
  const pinyinInitialsText = getPinyinInitials(source).toLowerCase()
  return pinyinInitialsText.includes(searchTerm)
}
