<script setup>
import { computed } from 'vue'
import { useI18n, getSizePx } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useImagePlaceholder } from '../composables/useImagePlaceholder'
import StarsDisplay from './StarsDisplay.vue'
import { STAR_LEVEL_MAP } from '../utils/stars'
import IconDisplay from './IconDisplay.vue'

const { getTraitColorHex, currentLang } = useI18n()
const { baseCharacterMap } = useCharacterData()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 8 },
  scale: { type: Number, required: true },
  imageS: { type: String, default: null },
})

const canvasSize = 160

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)

const starDisplayCount = computed(() => {
  const level = STAR_LEVEL_MAP[props.indexEntry.initial_rarity] || 0
  const hasHalf = level !== Math.floor(level)
  return Math.floor(level) + (hasHalf ? 1 : 0)
})

const charImage = computed(() => {
  const img = props.imageS || props.indexEntry.image_S
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

</script>

<template>
  <div class="avatar-component" :style="{ width: sizePx + 'px', height: sizePx + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (sizePx / canvasSize) + ')', transformOrigin: '0 0' }">
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 160 160"
        xmlns="http://www.w3.org/2000/svg"
        style="overflow: visible;"
      >
        <polygon points="80,4 4,80 80,156" :fill="traitHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="80,4 156,80 80,156" :fill="supportHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="80,12 12,80 80,148" :fill="traitHex"/>
        <polygon points="80,12 148,80 80,148" :fill="supportHex"/>
      </svg>
      <img
        v-if="!imageLoaded"
        :src="PLACEHOLDER"
        class="placeholder-img"
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
        <IconDisplay type="role" :id="roleId" :scale="0" :size="4" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right" style="top: 4px; right: 4px">
        <IconDisplay type="attribute" :id="attributeId" :scale="0" :size="3" />
      </div>
      <div v-if="starDisplayCount > 0"
        :style="{
          position: 'absolute',
          left: ((canvasSize - starDisplayCount * 45 * 0.6) / 2) + 'px',
          top: (canvasSize - 45 * 0.6 - 5) + 'px',
        }"
      >
        <StarsDisplay :mode="1" :rarity="indexEntry.initial_rarity" :max-rarity="indexEntry.max_rarity" :scale="0.6" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-img {
  position: absolute;
  top: 20px;
  left: 16px;
  width: 128px;
  height: 128px;
  object-fit: cover;
}
.placeholder-img {
  position: absolute;
  top: 32px;
  left: 32px;
  width: 96px;
  height: 96px;
  object-fit: cover;
}
.fallback-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-light);
  font-weight: 600;
  font-size: 16px;
  line-height: 1.2;
  text-shadow: var(--shadow-text);
  user-select: none;
  -webkit-user-select: none;
}
.img-hidden { visibility: hidden; }
</style>
