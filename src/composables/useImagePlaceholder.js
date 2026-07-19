import { ref, watch } from 'vue'
import { miscReady } from './useMiscPreload.js'

const PLACEHOLDER = 'image/misc/favicon.webp'

export function useImagePlaceholder(hrefRef) {
  const imageLoaded = ref(false)

  watch(hrefRef, (href) => {
    if (!href) {
      imageLoaded.value = false
      return
    }
    const _load = () => {
      const img = new Image()
      img.src = href
      if (img.complete) {
        imageLoaded.value = true
      } else {
        imageLoaded.value = false
        img.onload = () => {
          imageLoaded.value = true
        }
      }
    }
    if (href === PLACEHOLDER) {
      _load()
    } else {
      if (miscReady.value) { _load() }
      else {
        imageLoaded.value = false
        const stop = watch(miscReady, (v) => {
          if (v) { stop(); _load() }
        })
      }
    }
  }, { immediate: true })

  return { imageLoaded, PLACEHOLDER }
}
