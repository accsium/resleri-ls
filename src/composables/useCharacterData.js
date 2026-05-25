import { ref, shallowRef } from 'vue'

const characterIndex = ref([])
const loadedCharacters = shallowRef({})

export function useCharacterData() {
  async function loadIndex() {
    const resp = await fetch('data/character_index.json')
    characterIndex.value = await resp.json()
  }

  async function loadCharacter(id) {
    if (loadedCharacters.value[id]) return loadedCharacters.value[id]
    const resp = await fetch(`data/${id}.json`)
    const data = await resp.json()
    loadedCharacters.value = { ...loadedCharacters.value, [id]: data }
    return data
  }

  return { characterIndex, loadedCharacters, loadIndex, loadCharacter }
}
