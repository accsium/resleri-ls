<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import { preFetch } from '../router'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import MemoriaDisplay from '../components/MemoriaDisplay.vue'

const todoHtml = ref('')

onMounted(async () => {
  let md = await preFetch.todo
  if (!md) {
    const res = await fetch('config/todo.md')
    md = await res.text()
  }
  todoHtml.value = marked.parse(md)
})

const fictionalChar = {
  id: 99999,
  image_M: 'nonexistent_char',
  base_character_id: 101,
  another_name: '【虚构角色】',
  trait_color_id: 1,
  support_color_id: 2,
  attack_attributes: [1],
  role: 1,
  initial_rarity: 3,
  max_rarity: 5,
}

const fictionalMemoria = {
  id: 99999,
  image_square: 'nonexistent_memoria',
  name: '虚构回忆',
}
</script>

<template>
  <div class="todo-container">
    <div v-if="todoHtml" class="todo-content" v-html="todoHtml"></div>
    <div v-else class="todo-content">加载中...</div>
  </div>

  <div class="fallback-test">
    <h2>Fallback 占位图测试</h2>
    <div class="fallback-row">
      <div class="fallback-item">
        <h3>虚构角色（不存在 image_M）</h3>
        <AvatarDisplay :index-entry="fictionalChar" :scale="1" :size="0" />
      </div>
      <div class="fallback-item">
        <h3>虚构回忆（不存在 image_square）</h3>
        <MemoriaDisplay :entry="fictionalMemoria" :scale="1" :size="0" />
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

.fallback-test {
  margin: 16px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.fallback-test h2 {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--text-primary);
}
.fallback-test h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-secondary);
}
.fallback-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.fallback-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
