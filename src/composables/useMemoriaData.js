import { ref } from 'vue'
import { getNavigationSignal } from '../router'
import { trackData } from './useProgress'

const memoriaList = ref([])

async function _fetchJSON(url) {
  const resp = await fetch(url, { signal: getNavigationSignal() })
  if (!resp.ok) throw new Error('HTTP ' + resp.status)
  return resp.json()
}

let _loadPromise = null

async function _doLoadMemoria() {
  try {
    const data = await _fetchJSON('data/memoria.json')
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
