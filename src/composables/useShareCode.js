export function useShareCode() {
  // UID 排序：按 UID 升序，新角色永远追加在末尾
  function canonicalSort(a, b) {
    return (a.uid || '').localeCompare(b.uid || '')
  }

  function getCanonicalOrder(characterIndex) {
    return [...characterIndex].sort(canonicalSort)
  }

  function encodeShareCode(ownedIds, characterIndex) {
    const sorted = getCanonicalOrder(characterIndex)
    const ownedSet = new Set(ownedIds)
    const byteCount = Math.ceil(sorted.length / 8)
    const bytes = new Uint8Array(byteCount)
    for (let i = 0; i < sorted.length; i++) {
      if (ownedSet.has(sorted[i].id)) {
        bytes[Math.floor(i / 8)] |= (1 << (i % 8))
      }
    }
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  function decodeShareCode(code, characterIndex) {
    try {
      let std = code.replace(/-/g, '+').replace(/_/g, '/')
      while (std.length % 4) std += '='
      const binary = atob(std)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const sorted = getCanonicalOrder(characterIndex)
      const owned = []
      for (let i = 0; i < sorted.length; i++) {
        const byteIndex = Math.floor(i / 8)
        if (byteIndex >= bytes.length) break
        if (bytes[byteIndex] & (1 << (i % 8))) {
          owned.push(sorted[i].id)
        }
      }
      return owned
    } catch {
      return null
    }
  }

  return { encodeShareCode, decodeShareCode, getCanonicalOrder, canonicalSort }
}
