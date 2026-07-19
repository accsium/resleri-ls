import { ref, watch } from 'vue'

const PLACEHOLDER = 'image/misc/favicon.webp'

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
