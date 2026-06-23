import { ref, shallowRef, triggerRef, computed } from 'vue'
import { getNavigationSignal } from '../router'

const characterIndex = ref([])
const loadedCharacters = shallowRef({})
const indexLoadError = ref(null)
const indexLoaded = ref(false)

const dataBytesLoaded = ref(0)
const dataBytesTotal = ref(1)
const imgBytesLoaded = ref(0)
const imgBytesTotal = ref(0)

const loadProgress = computed(() => {
  const total = dataBytesTotal.value + imgBytesTotal.value
  if (total === 0) return 0
  return Math.min(100, Math.round(((dataBytesLoaded.value + imgBytesLoaded.value) / total) * 100))
})

// 辅助：从 ReadableStream 读取全部 chunk 并合并为 Uint8Array
async function _readAllChunks(reader, onChunk) {
  const chunks = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    if (onChunk) onChunk(value.length)
  }
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0)
  const merged = new Uint8Array(totalLen)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.length
  }
  return merged
}

// 模块级立即发起索引抓取，不等 onMounted
async function _doLoadIndex() {
  try {
    const resp = await fetch('data/character_index.json', { signal: getNavigationSignal() })
    const total = parseInt(resp.headers.get('Content-Length') || '0')
    dataBytesTotal.value = total
    const reader = resp.body.getReader()
    let loaded = 0
    const merged = await _readAllChunks(reader, (chunkLen) => {
      loaded += chunkLen
      dataBytesLoaded.value = loaded
    })
    if (dataBytesTotal.value === 0 || dataBytesTotal.value < loaded) {
      dataBytesTotal.value = loaded
      dataBytesLoaded.value = loaded
    }
    const text = new TextDecoder().decode(merged)
    characterIndex.value = JSON.parse(text)
    indexLoadError.value = null
    indexLoaded.value = true
  } catch (e) {
    if (e.name === 'AbortError') return
    indexLoadError.value = e.message || String(e)
    characterIndex.value = []
    indexLoaded.value = true
  }
}

const _indexPromise = _doLoadIndex()

export function useCharacterData() {
  async function loadIndex() {
    await _indexPromise
  }

  async function loadCharacter(id) {
    if (loadedCharacters.value[id]) return loadedCharacters.value[id]
    const resp = await fetch(`data/character/${id}.json`, { signal: getNavigationSignal() })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    // 流式读取，字节临时计入全局进度
    // try-finally 保证异常时也回退进度计数，防止进度条卡死
    const total = parseInt(resp.headers.get('Content-Length') || '0')
    if (!resp.body) return resp.json()
    const reader = resp.body.getReader()
    let merged
    try {
      if (total > 0) dataBytesTotal.value += total
      merged = await _readAllChunks(reader, (chunkLen) => {
        dataBytesLoaded.value += chunkLen
      })
    } finally {
      dataBytesTotal.value = 0
      dataBytesLoaded.value = 0
    }

    const text = new TextDecoder().decode(merged)
    const data = JSON.parse(text)
    loadedCharacters.value[id] = data
    triggerRef(loadedCharacters)
    return data
  }

  function trackImage(size) {
    imgBytesTotal.value += size
  }

  function imageDone(size) {
    imgBytesLoaded.value += size
  }

  function untrackImage(size, loaded) {
    imgBytesTotal.value = Math.max(0, imgBytesTotal.value - size)
    if (loaded) {
      imgBytesLoaded.value = Math.max(0, imgBytesLoaded.value - size)
    }
  }

  return { characterIndex, loadedCharacters, indexLoadError, indexLoaded, loadIndex, loadCharacter, loadProgress, trackImage, imageDone, untrackImage }
}
