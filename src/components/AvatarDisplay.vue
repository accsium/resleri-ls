<script setup>
import { computed } from 'vue'
import { useI18n, getSizePx } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useImagePlaceholder } from '../composables/useImagePlaceholder'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

let uid = 0
const { getTraitColorHex, currentLang } = useI18n()
const { baseCharacterMap } = useCharacterData()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 8 },
  scale: { type: Number, required: true },
  kid: { type: String, default: '' },
  imageM: { type: String, default: null },
})

const canvasSize = 320
const kid = props.kid || (++uid + '-' + props.indexEntry.id)

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)

const starLevel = { 1:1, 2:2, 3:3, 4:3.5, 5:4, 6:4.5, 7:5, 8:6 }
const starDisplayCount = computed(() => {
  const level = starLevel[props.indexEntry.initial_rarity] || 0
  const hasHalf = level !== Math.floor(level)
  return Math.floor(level) + (hasHalf ? 1 : 0)
})

const charImage = computed(() => {
  const img = props.imageM || props.indexEntry.image_M
  if (!img) return null
  return `image/character/${img}.webp`
})
const { imageLoaded, PLACEHOLDER } = useImagePlaceholder(charImage)

const sizePx = computed(() => getSizePx(props.scale, props.size))

const maskUrl = 'url(image/misc/mask-g.svg)'

const baseName = computed(() => {
  const bc = baseCharacterMap.value[props.indexEntry.base_character_id]
  if (!bc) return ''
  return currentLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
})
const aliasName = computed(() => props.indexEntry.another_name || '')

const BASE_FONT = 32
function _weightedLen(str) {
  let w = 0
  for (const ch of str) { w += /[一-鿿　-〿＀-￯]/.test(ch) ? 1 : 0.55 }
  return Math.max(w, 1)
}
const textScale = computed(() => {
  const nw = _weightedLen(baseName.value)
  const aw = aliasName.value ? _weightedLen(aliasName.value) : 0
  const maxW = Math.max(nw, aw)
  if (maxW === 0) return 1
  return Math.min(1, 320 / (BASE_FONT * maxW))
})

</script>

<template>
  <div class="avatar-component" :style="{ width: sizePx + 'px', height: sizePx + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (sizePx / canvasSize) + ')', transformOrigin: '0 0' }">
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 320 320"
        xmlns="http://www.w3.org/2000/svg"
        style="overflow: visible;"
      >
        <polygon points="160,10 10,160 160,310" :fill="traitHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="160,10 310,160 160,310" :fill="supportHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="160,25 25,160 160,295" :fill="traitHex"/>
        <polygon points="160,25 295,160 160,295" :fill="supportHex"/>
      </svg>
      <img
        v-if="!imageLoaded"
        :src="PLACEHOLDER"
        class="avatar-img"
      />
      <span v-if="!imageLoaded" class="fallback-text">
        <span>{{ baseName }}</span>
        <span v-if="aliasName">{{ aliasName }}</span>
      </span>
      <img
        v-if="charImage"
        :src="charImage"
        class="avatar-img"
        :class="{ 'img-hidden': !imageLoaded }"
        :style="{ WebkitMaskImage: maskUrl, maskImage: maskUrl }"
      />
      <div v-if="roleId" class="overlay-icon overlay-icon-left" style="top: 0; left: 0">
        <IconDisplay type="role" :id="roleId" :scale="1" :size="4" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right" style="top: 8px; right: 8px">
        <IconDisplay type="attribute" :id="attributeId" :scale="1" :size="3" />
      </div>
      <div v-if="starDisplayCount > 0"
        :style="{
          position: 'absolute',
          left: ((canvasSize - starDisplayCount * 45 * 1.25) / 2) + 'px',
          top: (canvasSize - 45 * 1.25 - 10) + 'px',
        }"
      >
        <StarsDisplay :mode="1" :rarity="indexEntry.initial_rarity" :max-rarity="indexEntry.max_rarity" :scale="1.25" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-img {
  position: absolute;
  top: 39px;
  left: 32px;
  width: 256px;
  height: 256px;
  object-fit: cover;
}
.fallback-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 320px;
  height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-light);
  font-weight: 600;
  font-size: 32px;
  line-height: 1.2;
  text-shadow: 0 0 6px rgba(0,0,0,0.8);
  user-select: none;
  -webkit-user-select: none;
}
.img-hidden { visibility: hidden; }
</style>
