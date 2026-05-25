import { ref } from 'vue'

const updateTimeText = ref('更新时间 — (GMT+08:00)')

export function useBuildInfo() {
  async function loadBuildTime() {
    try {
      const resp = await fetch('data/meta.json')
      const meta = await resp.json()
      const buildTime = new Date(meta.build_time)
      const gmt8 = new Date(buildTime.getTime() + 8 * 60 * 60 * 1000)
      const pad = (n) => String(n).padStart(2, '0')
      const timeStr = `${gmt8.getUTCFullYear()}/${pad(gmt8.getUTCMonth() + 1)}/${pad(gmt8.getUTCDate())} ${pad(gmt8.getUTCHours())}:${pad(gmt8.getUTCMinutes())}:${pad(gmt8.getUTCSeconds())} GMT+08:00`
      const localOffset = -new Date().getTimezoneOffset()
      if (localOffset === 480) {
        updateTimeText.value = `更新时间 ${timeStr}`
      } else {
        const localStr = buildTime.toLocaleString()
        const sign = localOffset >= 0 ? '+' : '-'
        const hours = Math.floor(Math.abs(localOffset) / 60)
        const minutes = Math.abs(localOffset) % 60
        updateTimeText.value = `更新时间 ${localStr} (GMT${sign}${pad(hours)}:${pad(minutes)})`
      }
    } catch {
      updateTimeText.value = '更新时间 — (GMT+08:00)'
    }
  }

  return { updateTimeText, loadBuildTime }
}
