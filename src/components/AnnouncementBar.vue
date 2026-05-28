<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const announcements = ref([])
const dismissed = ref([])

const visible = computed(() => {
  const path = route.path
  return announcements.value.filter(a => {
    if (dismissed.value.includes(a.id)) return false
    return a.scope === 'global' || a.scope === path
  })
})

function dismiss(id) {
  dismissed.value = [...dismissed.value, id]
}

onMounted(async () => {
  try {
    const res = await fetch('config/announcements.json')
    announcements.value = await res.json()
  } catch {}
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
  border-bottom: 1px solid rgba(255,255,255,0.08);
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
