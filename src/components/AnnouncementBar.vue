<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const announcements = ref([])
const dismissed = ref([])

const scope = computed(() => {
  const file = location.pathname.split('/').pop() || ''
  return '/' + file.replace(/\.html$/, '')
})

const visible = computed(() => {
  return announcements.value.filter(a => {
    if (dismissed.value.includes(a.id)) return false
    return a.scope === 'global' || a.scope === scope.value
  })
})

function dismiss(id) {
  dismissed.value = [...dismissed.value, id]
}

let abortController = null

onMounted(async () => {
  abortController = new AbortController()
  const { signal } = abortController
  const res = await fetch('config/announcements.json', { signal })
  if (!res.ok || signal.aborted) return
  announcements.value = await res.json()
})

onUnmounted(() => {
  abortController?.abort()
})
</script>

<template>
  <div v-if="visible.length" class="ab-bar">
    <div
      v-for="a in visible" :key="a.id"
      class="ab-row"
    >
      <span class="ab-text">{{ a.text }}</span>
      <button v-if="a.dismissible !== false" class="ab-close" @click="dismiss(a.id)">&#10005;</button>
    </div>
  </div>
</template>

<style scoped>
.ab-bar {
  flex-shrink: 0;
  max-height: 120px;
  overflow-y: auto;
}
.ab-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 24px;
  background: var(--bg-banner);
  color: var(--text-light);
  font-size: 13px;
  border-bottom: 1px solid var(--overlay-white-08);
}
.ab-text {
  flex: 1;
  min-width: 0;
}
.ab-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-light);
  opacity: 0.6;
  font-size: 14px;
  padding: 2px 6px;
  cursor: pointer;
}
.ab-close:hover {
  opacity: 1;
}
</style>
