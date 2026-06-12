/**
 * null 安全比较两个值，支持排序方向
 * @param {*} va - 值 A
 * @param {*} vb - 值 B
 * @param {number} dir - 排序方向 (1 = asc, -1 = desc)
 * @returns {number} 比较结果 (>0 表示 va 排在 vb 之后)
 */
export function cmpVal(va, vb, dir) {
  // 数组取首个元素
  if (Array.isArray(va)) va = va[0]
  if (Array.isArray(vb)) vb = vb[0]
  // null 值排在末尾（尊重排序方向）
  if (va == null && vb == null) return 0
  if (va == null) return 1 * dir
  if (vb == null) return -1 * dir
  // 字符串比较
  if (typeof va === 'string') {
    const c = va.localeCompare(vb)
    return c ? c * dir : 0
  }
  // 数值比较
  if (va < vb) return -1 * dir
  if (va > vb) return 1 * dir
  return 0
}
