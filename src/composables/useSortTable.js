import { ref, computed } from 'vue'

/**
 * 通用表格排序 composable
 *
 * @param {Object}   options
 * @param {string}   options.defaultCol  默认排序列
 * @param {string}   options.defaultDir  默认排序方向 ('asc'|'desc')
 * @param {string}  [options.avatarAlias] 点击头像列时实际排序的列
 * @returns {{ sortPriority, sortDirs, sortCol, sortDir, onSort, cmpVal, sortItems }}
 */
export function useSortTable({ defaultCol = 'id', defaultDir = 'asc', avatarAlias = null } = {}) {
  const sortPriority = ref([defaultCol])
  const sortDirs = ref({ [defaultCol]: defaultDir })
  const sortCol = computed(() => sortPriority.value[0] || defaultCol)
  const sortDir = computed(() => sortDirs.value[sortCol.value] || defaultDir)

  /**
   * null 安全比较两个值
   */
  function cmpVal(va, vb, dir) {
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string') {
      const c = va.localeCompare(vb)
      return c ? c * dir : 0
    }
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  }

  /**
   * 表头点击：切换方向或将新列推到优先级头部
   */
  function onSort(col) {
    if (avatarAlias && col === 'avatar') col = avatarAlias
    const cur = [...sortPriority.value]
    const idx = cur.indexOf(col)
    if (idx === 0) {
      // 同一列 → 切换方向
      sortDirs.value = { ...sortDirs.value, [col]: sortDirs.value[col] === 'asc' ? 'desc' : 'asc' }
    } else {
      // 新列 → 推到最前
      if (idx > 0) cur.splice(idx, 1)
      cur.unshift(col)
      sortPriority.value = cur
      // 首次点击默认降序
      if (!(col in sortDirs.value)) {
        sortDirs.value = { ...sortDirs.value, [col]: 'desc' }
      }
    }
  }

  /**
   * 对数组应用多级排序（返回新数组，不修改原数组）
   * @param {Array}  items     待排序数组
   * @param {Function} getSortVal (item, field) => value
   * @returns {Array}
   */
  function sortItems(items, getSortVal) {
    const list = [...items]
    list.sort((a, b) => {
      for (const field of sortPriority.value) {
        const dir = (sortDirs.value[field] || 'desc') === 'desc' ? -1 : 1
        const r = cmpVal(getSortVal(a, field), getSortVal(b, field), dir)
        if (r !== 0) return r
      }
      return 0
    })
    return list
  }

  return { sortPriority, sortDirs, sortCol, sortDir, onSort, cmpVal, sortItems }
}
