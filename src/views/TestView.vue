<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import MemoriaDisplay from '../components/MemoriaDisplay.vue'
import MemoriaDisplay_M from '../components/MemoriaDisplay_M.vue'
import { useMemoriaData } from '../composables/useMemoriaData'

const { memoriaList, loadMemoria } = useMemoriaData()

const todoHtml = ref('')
const scopeGroups = ref([])

onMounted(async () => {
  const res = await fetch('config/todo.md')
  const md = await res.text()
  todoHtml.value = marked.parse(md)

  scopeGroups.value = [
    { id: 1, memoria_ids: [30073] },
    { id: 3, memoria_ids: [30115, 30119] },
    { id: 4, memoria_ids: [30116, 30121] },
    { id: 5, memoria_ids: [30122, 30123] },
    { id: 6, memoria_ids: [30122, 30123, 30124] },
    { id: 7, memoria_ids: [30128, 30129, 30130] },
    { id: 8, memoria_ids: [30131, 30133, 30134] },
    { id: 9, memoria_ids: [30135, 30136, 30137] },
    { id: 10, memoria_ids: [30135, 30137, 30138, 30139] },
    { id: 11, memoria_ids: [30167] },
  ]
  await loadMemoria()
})

const memoriaMap = computed(() => {
  const map = {}
  for (const m of memoriaList.value) {
    map[m.id] = m
  }
  return map
})

const placeholderChar = {
  id: 99999,
  image_M: 'nonexistent_char',
  base_character_id: 101,
  another_name: '【Lovely Bomber MAXIMUM】',
  trait_color_id: 1,
  support_color_id: 2,
  attack_attributes: [1],
  role: 1,
  initial_rarity: 5,
  max_rarity: 5,
}

const placeholderMemoria = {
  id: 99999,
  image_square: 'nonexistent_memoria',
  image_M: 'nonexistent_memoria',
  name: '虚构回忆',
}

const scopedMemoria = computed(() =>
  scopeGroups.value.map(group => ({
    id: group.id,
    memoria: group.memoria_ids
      .map(id => memoriaMap.value[id])
      .filter(Boolean)
  }))
)
</script>

<template>
  <div class="todo-container">
    <div v-if="todoHtml" class="todo-content" v-html="todoHtml"></div>
    <div v-else class="todo-content">加载中...</div>
  </div>

  <div class="placeholder-test">
    <h2 class="scope-title">占位图 + 文字回退测试</h2>
    <div class="placeholder-row">
      <AvatarDisplay :index-entry="placeholderChar" :scale="1" :size="0" />
      <MemoriaDisplay :entry="placeholderMemoria" :scale="1" :size="0" />
      <MemoriaDisplay_M :entry="placeholderMemoria" :scale="2" :size="0" />
    </div>
  </div>

  <div class="scope-section">
    <div v-for="scope in scopedMemoria" :key="scope.id" class="scope-group">
      <h2 class="scope-title">Scope {{ scope.id }}</h2>
      <div class="scope-memoria-list">
        <MemoriaDisplay_M
          v-for="m in scope.memoria"
          :key="m.id"
          :entry="m"
          :scale="2"
          :size="0"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-container {
  margin: 16px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 13px;
}
.todo-content :deep(h1),
.todo-content :deep(h2),
.todo-content :deep(h3) {
  margin: 0 0 8px;
  color: var(--text-primary);
}
.todo-content :deep(ul), .todo-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 24px;
}
.todo-content :deep(li) {
  margin-bottom: 4px;
}
.todo-content :deep(p) {
  margin: 0 0 8px;
}
.todo-content :deep(code) {
  background: var(--bg-stat);
  padding: 2px 6px;
  border-radius: var(--radius);
}
.todo-content :deep(pre) {
  background: var(--bg-stat);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
}

.scope-section {
  margin: 16px;
}
.scope-group {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.scope-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-primary);
}
.placeholder-test {
  margin: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.placeholder-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.placeholder-row :deep(.avatar-component) {
  margin: 0;
}
.scope-memoria-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
