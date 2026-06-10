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
// ── UI 状态持久化 ──
const UI_KEY = 'resleri-collection-ui'
function loadUI(key, def) {
  try { const r = localStorage.getItem(UI_KEY); if (r) { const v = JSON.parse(r)[key]; if (v != null) return v } } catch {}
  return def
}
function saveUI() {
  localStorage.setItem(UI_KEY, JSON.stringify({
    viewMode: viewMode.value, seqSize: seqSize.value, matSize: matSize.value,
    colorMode: colorMode.value, showOwned: showOwned.value, showUnowned: showUnowned.value,
  }))
}
const viewMode = ref(loadUI('viewMode', 'sequential'))
const seqSize = ref(loadUI('seqSize', 84))
const matSize = ref(loadUI('matSize', 48))
const colorMode = ref(loadUI('colorMode', false))
const outlineWidth = computed(() => Math.max(1, Math.round((viewMode.value === 'sequential' ? seqSize.value : matSize.value) / 36)) + 'px')
const sizeSteps = computed(() => {
  const min = viewMode.value === 'sequential' ? 48 : 24
  const max = viewMode.value === 'sequential' ? 160 : 80
  const step = viewMode.value === 'sequential' ? 16 : 8
  const cur = viewMode.value === 'sequential' ? seqSize.value : matSize.value
  const steps = []
  for (let s = min; s <= max; s += step) steps.push({ val: s, active: s === cur, below: s < cur })
  return steps
})
const seqGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, ${seqSize.value}px)`,
  gridAutoRows: `${seqSize.value}px`,
  '--item-w': `${seqSize.value}px`,
}))

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

  // 拥有筛选
  if (!showOwned.value || !showUnowned.value) {
    list = list.filter(c => {
      const owned = isOwned(c.id)
      if (owned && !showOwned.value) return false
      if (!owned && !showUnowned.value) return false
      return true
    })
  }

  // UID 倒序（最新在前）
  list.sort((a, b) => (b.uid || '').localeCompare(a.uid || ''))
  return list
})

const noMatch = computed(() => filteredSortedCharacters.value.length === 0)

// ── 拥有筛选 ──
const showOwned = ref(loadUI('showOwned', true))
const showUnowned = ref(loadUI('showUnowned', true))
watch([viewMode, seqSize, matSize, colorMode, showOwned, showUnowned], saveUI)

// ── 操作 ──
const shareInput = ref('')
const savedFlash = ref(false)
const copiedFlash = ref(false)

function onLoadCode() {
  if (shareInput.value) {
    loadFromCode(shareInput.value, characterIndex.value)
  }
}

// ── 拖拽选择 ──
const dragging = ref(false)
const dragAction = ref(null)
function onPointerDown(id) {
  dragging.value = true
  const owned = isOwned(id)
  dragAction.value = owned ? 'remove' : 'add'
  toggleOwned(id)
}
function onPointerEnter(id) {
  if (!dragging.value) return
  const owned = isOwned(id)
  if (dragAction.value === 'add' && !owned) toggleOwned(id)
  else if (dragAction.value === 'remove' && owned) toggleOwned(id)
}
function onPointerUp() {
  dragging.value = false
  dragAction.value = null
}
function selectAll() {
  for (const c of characterIndex.value) {
    if (!isOwned(c.id)) toggleOwned(c.id)
  }
}
function invertSelect() {
  for (const c of characterIndex.value) toggleOwned(c.id)
}
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
  <div class="collection-layout" :class="{ 'color-mode': colorMode }" :style="{ '--outline-w': outlineWidth, '--outline-r': outlineRadius }">
    <div v-if="!isLoaded" class="loading">{{ t('loading') }}</div>

    <template v-else>
      <!-- 控栏：保存 + 计数 + 分享码 -->
      <div class="collection-controls">
        <span class="collection-count">{{ t('collectionOwnedCount').replace('{n}', ownedCount).replace('{total}', characterIndex.length) }}</span>
        <button class="collection-save-btn" @click="onSave">
          {{ savedFlash ? t('collectionSaved') : t('collectionSave') }}
        </button>
        <input type="text" v-model="shareInput" class="collection-share-input" :placeholder="shareCode">
        <button class="collection-load-btn" @click="onLoadCode">读取</button>
        <button class="collection-copy-btn" @click="onCopyLink">
          {{ copiedFlash ? t('collectionCopied') : t('collectionCopyLink') }}
        </button>
      </div>

      <!-- 筛选栏 -->
      <FilterBar />

      <!-- 模式切换 -->
      <div class="collection-mode-bar">
        <span class="collection-mode-btns">
          <button
            :class="{ active: viewMode === 'sequential' }"
            @click="viewMode = 'sequential'"
          >{{ t('collectionSequential') }}</button>
          <button
            :class="{ active: viewMode === 'matrix' }"
            @click="viewMode = 'matrix'"
          >{{ t('collectionMatrix') }}</button>
          <label class="collection-check"><input type="checkbox" v-model="showOwned">已拥有</label>
          <label class="collection-check"><input type="checkbox" v-model="showUnowned">未拥有</label>
          <button class="collection-color-btn" @click="colorMode = !colorMode">{{ colorMode ? '彩色' : '黑白' }}</button>
          <button class="collection-color-btn" @click="selectAll">全选</button>
          <button class="collection-color-btn" @click="invertSelect">反选</button>
        </span>
        <span class="collection-size-group" v-if="viewMode === 'sequential'">
          <span class="collection-size-label">头像尺寸</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="seqSize = s.val"></span>
          </span>
        </span>
        <span class="collection-size-group" v-else>
          <span class="collection-size-label">头像尺寸</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="matSize = s.val"></span>
          </span>
        </span>
      </div>

      <!-- 列表模式 -->
      <div v-if="viewMode === 'sequential'" class="collection-sequential" :style="seqGridStyle" @pointerup="onPointerUp" @pointerleave="onPointerUp">
        <div
          v-for="entry in filteredSortedCharacters"
          :key="entry.id"
          class="collection-avatar-item"
          :class="{ owned: isOwned(entry.id) }"
          @click="onAvatarClick(entry.id)"
          @pointerdown="onPointerDown(entry.id)"
          @pointerenter="onPointerEnter(entry.id)"
        >
          <AvatarDisplay :index-entry="entry" :size="seqSize" />
        </div>
        <div v-if="noMatch" class="collection-empty">{{ t('collectionNoMatch') }}</div>
      </div>

      <!-- 矩阵模式 -->
      <CollectionMatrix
        v-else
        :characters="filteredSortedCharacters"
        :owned-set="ownedIds"
        :size="matSize"
        :on-pointer-down="onPointerDown"
        :on-pointer-enter="onPointerEnter"
        @toggle="onAvatarClick"
        @pointerup="onPointerUp"
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

.collection-share-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-family: monospace;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-stat);
  color: var(--text-primary);
}
.collection-load-btn {
  font-size: 12px;
  padding: 4px 12px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: var(--radius);
  cursor: pointer;
}

/* 模式切换 */
.collection-mode-bar {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.collection-mode-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.collection-mode-bar button {
  padding: 0 8px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}
.collection-mode-bar button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.collection-check {
  font-size: 12px;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  margin-left: 8px;
}
.collection-check input {
  accent-color: var(--accent);
}
.collection-size-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 12px;
}
.collection-size-btn {
  width: 20px; height: 20px;
  font-size: 14px; line-height: 1;
  padding: 0; border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
}
.collection-size-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
.size-steps {
  display: flex;
  align-items: center;
}
.size-step {
  width: 10px; height: 10px;
  background: #5a6a7e;
  border: 0.2px solid #000;
  cursor: pointer;
  box-sizing: border-box;
  margin-left: -1px;
}
.size-step:first-child { margin-left: 0; }
.size-step.below { background: #42a5f5; }
.size-step.active { background: #fdd835; }

/* 列表模式 */
.collection-sequential {
  display: grid;
  justify-content: center;
  padding: 16px;
  background: #4a515e;
  border-radius: var(--radius-lg);
}
.collection-sequential .collection-avatar-item {
  line-height: 0;
  width: var(--item-w);
  height: var(--item-w);
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
