// 共享 JSON 获取（从 useCharacterData/useMemoriaData 提取）
export async function fetchJSON(url) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('HTTP ' + resp.status)
  return resp.json()
}
