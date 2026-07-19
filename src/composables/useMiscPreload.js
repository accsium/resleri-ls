import { ref } from 'vue'

const miscReady = ref(false)
let _promise = null

export function preloadMiscImages() {
  if (_promise) return _promise

  const links = document.querySelectorAll('link[rel="preload"][as="image"]')
  const tasks = []
  links.forEach(link => {
    const href = link.getAttribute('href')
    if (!href || href.startsWith('data:')) return
    tasks.push(new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve()
      img.src = href
    }))
  })

  _promise = Promise.all(tasks).then(() => { miscReady.value = true })
  return _promise
}

export { miscReady }
