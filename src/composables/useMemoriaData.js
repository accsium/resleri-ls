import { ref } from 'vue'
import { trackData } from './useProgress'
import { fetchJSON } from '../utils/fetch'

const memoriaList = ref([])

let _loadPromise = null

async function _doLoadMemoria() {
  try {
    const data = await fetchJSON('data/memoria.json')
    memoriaList.value = data
  } catch (e) {
    _loadPromise = null
    if (e.name === 'AbortError') return
  }
}

export function useMemoriaData() {
  async function loadMemoria() {
    const done = trackData(memoriaList.value.length > 0)
    if (!_loadPromise) _loadPromise = _doLoadMemoria()
    await _loadPromise
    done()
  }

  return {
    memoriaList,
    loadMemoria,
  }
}
