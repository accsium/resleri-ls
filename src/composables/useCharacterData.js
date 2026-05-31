import { ref, shallowRef, computed } from 'vue'

const characterIndex = ref([])
const loadedCharacters = shallowRef({})

const dataBytesLoaded = ref(0)
const dataBytesTotal = ref(1)
const imgBytesLoaded = ref(0)
const imgBytesTotal = ref(0)

const loadProgress = computed(() => {
  const d = dataBytesTotal.value > 0 ? dataBytesLoaded.value / dataBytesTotal.value : 0
  const i = imgBytesTotal.value > 0 ? imgBytesLoaded.value / imgBytesTotal.value : 1
  const total = dataBytesTotal.value + imgBytesTotal.value
  if (total === 0) return 0
  return Math.round(((dataBytesLoaded.value + imgBytesLoaded.value) / total) * 100)
})

export function useCharacterData() {
  async function loadIndex() {
    const resp = await fetch('data/character_index.json')
    const total = parseInt(resp.headers.get('Content-Length') || '0')
    dataBytesTotal.value = total
    const reader = resp.body.getReader()
    const chunks = []
    let loaded = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      dataBytesLoaded.value = loaded
    }
    const text = new TextDecoder().decode(
      chunks.reduce((acc, c) => { const a = new Uint8Array(acc.length + c.length); a.set(acc, 0); a.set(c, acc.length); return a }, new Uint8Array(0))
    )
    characterIndex.value = JSON.parse(text)
  }

  async function loadCharacter(id) {
    if (loadedCharacters.value[id]) return loadedCharacters.value[id]
    const resp = await fetch(`data/character/${id}.json`)
    const data = await resp.json()
    loadedCharacters.value = { ...loadedCharacters.value, [id]: data }
    return data
  }

  function trackImage(size) {
    imgBytesTotal.value += size
  }

  function imageDone(size) {
    imgBytesLoaded.value += size
  }

  return { characterIndex, loadedCharacters, loadIndex, loadCharacter, loadProgress, trackImage, imageDone }
}
