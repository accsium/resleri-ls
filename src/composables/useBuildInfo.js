import { ref } from 'vue'

const pad = (n) => String(n).padStart(2, '0')

function formatTime(isoStr) {
  const buildTime = new Date(isoStr)
  if (isNaN(buildTime.getTime())) return null
  const gmt8 = new Date(buildTime.getTime() + 8 * 60 * 60 * 1000)
  const timeStr = `${gmt8.getUTCFullYear()}/${pad(gmt8.getUTCMonth() + 1)}/${pad(gmt8.getUTCDate())} ${pad(gmt8.getUTCHours())}:${pad(gmt8.getUTCMinutes())}:${pad(gmt8.getUTCSeconds())} GMT+08:00`
  const localOffset = -new Date().getTimezoneOffset()
  if (localOffset === 480) return `最后更新： ${timeStr}`
  const sign = localOffset >= 0 ? '+' : '-'
  const hours = Math.floor(Math.abs(localOffset) / 60)
  const minutes = Math.abs(localOffset) % 60
  return `最后更新： ${buildTime.toLocaleString()} (GMT${sign}${pad(hours)}:${pad(minutes)})`
}

const initTime = typeof __BUILD_TIME__ !== 'undefined' ? formatTime(__BUILD_TIME__) : null
const updateTimeText = ref(initTime || '最后更新： — (GMT+08:00)')

export function useBuildInfo() {
  async function loadBuildTime() {
    try {
      const resp = await fetch('data/meta.json')
      const meta = await resp.json()
      const text = formatTime(meta.build_time)
      if (text) updateTimeText.value = text
    } catch {
      // keep current value
    }
  }

  return { updateTimeText, loadBuildTime }
}
