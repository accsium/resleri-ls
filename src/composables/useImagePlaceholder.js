import { ref, watch } from 'vue'

const PLACEHOLDER = 'image/misc/item_experience_FACE_M.webp'

export const PLACEHOLDER_ATTRS = { x: '0', y: '0', width: '320', height: '320' }

export function useImagePlaceholder(hrefRef) {
  const imageLoaded = ref(false)

  watch(hrefRef, (href) => {
    if (!href) {
      imageLoaded.value = false
      return
    }
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
  }, { immediate: true })

  return { imageLoaded, PLACEHOLDER }
}
