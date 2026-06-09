<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCollection } from '../composables/useCollection'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import CollectionMatrix from '../components/CollectionMatrix.vue'
import FilterBar from '../components/FilterBar.vue'
import { useFilters } from '../composables/useFilters'

const { t } = useI18n()
const { characterIndex } = useCharacterData()
const { ownedIds, ownedCount, shareCode, isOwned, toggleOwned, saveToStorage, loadFromCode } = useCollection()
const { activeFilters } = useFilters()
const route = useRoute()

// ── 视图模式 ──
const viewMode = ref('sequential')

// ── 从 URL 分享码初始化 ──
const codeFromUrl = computed(() => route.params.code || null)

watch([() => characterIndex.value.length, codeFromUrl], ([len, code]) => {
  if (len === 0) return
  if (code) {
    loadFromCode(code, characterIndex.value)
    // 无效 code 视为无 code，保持 localStorage 数据
  }
}, { immediate: true })

// ── 筛选 + 排序 ──
const filteredSortedCharacters = computed(() => {
  let list = [...characterIndex.value]

  const fa = activeFilters.value
  if (fa.initial_rarity.length) {
    list = list.filter(c => fa.initial_rarity.includes(c.initial_rarity))
  }
  if (fa.role.length) {
    list = list.filter(c => fa.role.includes(c.role))
  }
  if (fa.attack_attributes.length) {
    list = list.filter(c => (c.attack_attributes || []).some(a => fa.attack_attributes.includes(a)))
  }

  // 规范排序：start_at desc → initial_rarity desc → id desc
  list.sort((a, b) => {
    const sa = a.start_at || ''; const sb = b.start_at || ''
    if (sa > sb) return -1; if (sa < sb) return 1
    if (a.initial_rarity > b.initial_rarity) return -1
    if (a.initial_rarity < b.initial_rarity) return 1
    return b.id - a.id
  })
  return list
})

const noMatch = computed(() => filteredSortedCharacters.value.length === 0)

// ── 操作 ──
const savedFlash = ref(false)
const copiedFlash = ref(false)

function onAvatarClick(id) {
  toggleOwned(id)
}

function onSave() {
  saveToStorage()
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 1500)
}

async function onCopyLink() {
  const url = `${window.location.origin}${window.location.pathname}#/collection/${shareCode.value}`
  try {
    await navigator.clipboard.writeText(url)
    copiedFlash.value = true
    setTimeout(() => { copiedFlash.value = false }, 1500)
  } catch { /* clipboard not available */ }
}

// ── 加载状态 ──
const isLoaded = computed(() => characterIndex.value.length > 0)
</script>

<template>
  <div class="collection-layout">
    <div v-if="!isLoaded" class="loading">{{ t('loading') }}</div>

    <template v-else>
      <!-- 控栏：保存 + 计数 + 分享码 -->
      <div class="collection-controls">
        <span class="collection-count">{{ t('collectionOwnedCount').replace('{n}', ownedCount).replace('{total}', characterIndex.length) }}</span>
        <button class="collection-save-btn" @click="onSave">
          {{ savedFlash ? t('collectionSaved') : t('collectionSave') }}
        </button>
        <code class="collection-share-code">{{ shareCode }}</code>
        <button class="collection-copy-btn" @click="onCopyLink">
          {{ copiedFlash ? t('collectionCopied') : t('collectionCopyLink') }}
        </button>
      </div>

      <!-- 筛选栏 -->
      <FilterBar />

      <!-- 模式切换 -->
      <div class="collection-mode-bar">
        <button
          :class="{ active: viewMode === 'sequential' }"
          @click="viewMode = 'sequential'"
        >{{ t('collectionSequential') }}</button>
        <button
          :class="{ active: viewMode === 'matrix' }"
          @click="viewMode = 'matrix'"
        >{{ t('collectionMatrix') }}</button>
      </div>

      <!-- 列表模式 -->
      <div v-if="viewMode === 'sequential'" class="collection-sequential">
        <div
          v-for="entry in filteredSortedCharacters"
          :key="entry.id"
          class="collection-avatar-item"
          :class="{ owned: isOwned(entry.id) }"
          @click="onAvatarClick(entry.id)"
        >
          <AvatarDisplay :index-entry="entry" :size="84" />
        </div>
        <div v-if="noMatch" class="collection-empty">{{ t('collectionNoMatch') }}</div>
      </div>

      <!-- 矩阵模式 -->
      <CollectionMatrix
        v-else
        :characters="filteredSortedCharacters"
        :owned-set="ownedIds"
        @toggle="onAvatarClick"
      />
    </template>
  </div>
</template>

<style scoped>
.collection-layout {
  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 0 20px;
}

.collection-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.collection-count {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.collection-save-btn,
.collection-copy-btn {
  font-size: 12px;
  padding: 4px 12px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
}
.collection-save-btn:hover,
.collection-copy-btn:hover {
  background: var(--bg-stat);
}

.collection-share-code {
  font-size: 12px;
  background: var(--bg-stat);
  padding: 4px 8px;
  border-radius: var(--radius);
  font-family: monospace;
  color: var(--text-secondary);
  user-select: all;
}

/* 模式切换 */
.collection-mode-bar {
  display: flex;
  gap: 0;
  justify-content: center;
  padding: 8px 0;
}
.collection-mode-bar button {
  padding: 5px 20px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}
.collection-mode-bar button:first-child { border-radius: var(--radius) 0 0 var(--radius); }
.collection-mode-bar button:last-child  { border-radius: 0 var(--radius) var(--radius) 0; }
.collection-mode-bar button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* 列表模式 */
.collection-sequential {
  display: grid;
  grid-template-columns: repeat(auto-fill, 84px);
  gap: 10px;
  justify-content: center;
  padding: 16px;
  background: #4a515e;
  border-radius: var(--radius-lg);
}

/* 矩阵深色格子 */
.collection-layout :deep(.matrix-cell) {
  background: #4a515e;
}
.collection-layout :deep(.matrix-attr-label) {
  background: #4a515e;
  color: rgba(255,255,255,0.5);
}

.collection-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
  grid-column: 1 / -1;
}

/* 筛选用 wrapper（复用 global.css 的 sf-* 类，这里只做容器调整） */
.collection-layout :deep(.sf-wrapper) {
  margin: 0;
}
.collection-layout :deep(.sort-filter-bar) {
  border-radius: var(--radius-lg);
}
</style>
