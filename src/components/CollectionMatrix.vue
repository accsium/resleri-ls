<script setup>
import { computed } from 'vue'
import { useI18n, getSizePx } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import AvatarDisplay from './AvatarDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const props = defineProps({
  characters: { type: Array, required: true },
  ownedSet: { type: Object, required: true },
  size: { type: Number, default: 4 },
})

const sizePx = computed(() => getSizePx(0, props.size) + 'px')

const emit = defineEmits(['pointerdown', 'pointermove', 'pointerup'])

function onPointerMove(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const item = el?.closest('.collection-avatar-item')
  if (item?.dataset.id) emit('pointermove', Number(item.dataset.id))
}

const { currentLang, getField, ATTR_IDS } = useI18n()
const { attrMap: attrData, roleMap: roleData } = useCharacterData()

const attrMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(attrData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const roleMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(roleData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})

const ROLE_IDS = [1, 2, 3, 4]

// 按 (role, attr) 预分组
const cellMap = computed(() => {
  const map = {}
  for (const rid of ROLE_IDS) {
    for (const aid of ATTR_IDS) {
      map[`${rid}-${aid}`] = []
    }
  }
  for (const c of props.characters) {
    const role = c.role
    const attr = (c.attack_attributes || [])[0]
    if (role != null && attr != null) {
      const key = `${role}-${attr}`
      if (map[key]) map[key].push(c)
    }
  }
  return map
})

function getCell(rid, aid) {
  return cellMap.value[`${rid}-${aid}`] || []
}
</script>

<template>
  <table class="collection-matrix" @pointerup="emit('pointerup')" @pointerleave="emit('pointerup')" @pointermove="onPointerMove" @dragstart.prevent>
    <thead>
      <tr>
        <th class="matrix-corner"></th>
        <th v-for="rid in ROLE_IDS" :key="'rh'+rid" class="matrix-role-hd">
          <IconDisplay type="role" :id="rid" :scale="0" :size="0" />
          <span>{{ roleMap[rid] }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="aid in ATTR_IDS" :key="'ar'+aid">
        <td class="matrix-attr-label">
          <IconDisplay type="attribute" :id="aid" :scale="0" :size="0" />
          <span>{{ attrMap[aid] }}</span>
        </td>
        <td v-for="rid in ROLE_IDS" :key="'c'+rid+'-'+aid" class="matrix-cell">
          <div class="matrix-cell-inner">
            <div
              v-for="entry in getCell(rid, aid)"
              :key="entry.id"
              class="collection-avatar-item"
              :class="{ owned: ownedSet.has(entry.id) }"
              :data-id="entry.id"
              @pointerdown="emit('pointerdown', entry.id)"
            >
              <AvatarDisplay :index-entry="entry" :scale="0" :size="size" />
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.collection-matrix {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 4px;
}

.matrix-corner {
  width: 36px;
}

.matrix-role-hd {
  text-align: center;
  font-size: 12px;
  padding: 6px 8px;
  background: var(--bg-banner);
  color: var(--text-light);
  border-radius: var(--radius);
  white-space: nowrap;
}
.matrix-role-hd span {
  display: inline;
}

.matrix-attr-label {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 2px;
  background: var(--bg-stat);
  border-radius: var(--radius);
  white-space: nowrap;
}
.matrix-attr-label span {
  display: block;
  margin-top: 2px;
}

.matrix-cell {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 8px;
  vertical-align: top;
}
.matrix-cell-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, v-bind(sizePx));
  grid-auto-rows: v-bind(sizePx);
  justify-content: center;
}
.matrix-cell-inner > * {
  width: v-bind(sizePx);
  height: v-bind(sizePx);
}
</style>
