<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { preFetch } from '../router'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import MemoriaDisplay from '../components/MemoriaDisplay.vue'
import MemoriaDisplay_M from '../components/MemoriaDisplay_M.vue'
import { useMemoriaData } from '../composables/useMemoriaData'

const { memoriaList, loadMemoria } = useMemoriaData()

const todoHtml = ref('')
const scopeGroups = ref([])

onMounted(async () => {
  let md = await preFetch.todo
  if (!md) {
    const res = await fetch('config/todo.md')
    md = await res.text()
  }
  todoHtml.value = marked.parse(md)

  const scopeRes = await fetch('data/raw/jp/memoria_scope.json')
  scopeGroups.value = await scopeRes.json()
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
    <AvatarDisplay :index-entry="placeholderChar" :scale="1" :size="0" />
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
.scope-memoria-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
