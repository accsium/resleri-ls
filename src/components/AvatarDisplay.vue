<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

let uid = 0
const { getTraitColorHex, currentLang } = useI18n()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
  kid: { type: String, default: '' },
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

const charImage = computed(() => `image/character/${props.indexEntry.id}.png`)
const imageLoaded = ref(false)

const { baseCharacterMap } = useCharacterData()

const baseName = computed(() => {
  const bc = baseCharacterMap.value[props.indexEntry.base_character_id]
  if (!bc) return ''
  return currentLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
})
const aliasName = computed(() =>
  props.indexEntry.another_name || ''
)

const BASE_FONT = 32

function _weightedLen(str) {
  let w = 0
  for (const ch of str) {
    w += /[一-鿿　-〿＀-￯]/.test(ch) ? 1 : 0.55
  }
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
  <div class="avatar-component" :style="{ width: size + 'px', height: size + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (size / canvasSize) + ')', transformOrigin: '0 0' }">
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
        <image
          v-if="!imageLoaded"
          :href="'image/misc/00000.png'"
          x="32" y="39" width="256" height="256"
          mask="url(#mask-g)"
          preserveAspectRatio="xMidYMax meet"
        />
        <image
          :href="charImage"
          x="32" y="39" width="256" height="256"
          mask="url(#mask-g)"
          preserveAspectRatio="xMidYMax meet"
          :style="{ visibility: imageLoaded ? 'visible' : 'hidden' }"
          @load="imageLoaded = true"
        />
        <text
          v-if="!imageLoaded"
          class="fallback-text"
          :transform="'translate(160,160) scale(' + textScale + ')'"
          x="0" y="0"
          text-anchor="middle"
          dominant-baseline="central"
          font-weight="600"
          :font-size="BASE_FONT"
        >
          <tspan x="0">{{ baseName }}</tspan>
          <tspan v-if="aliasName" x="0" dy="1.2em">{{ aliasName }}</tspan>
        </text>
      </svg>
      <div v-if="roleId" class="overlay-icon overlay-icon-left">
        <IconDisplay type="role" :id="roleId" :size="100" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right">
        <IconDisplay type="attribute" :id="attributeId" :size="100" />
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
.fallback-text {
  fill: var(--text-light);
  text-shadow: 0 0 6px rgba(0,0,0,0.8);
  user-select: none;
  -webkit-user-select: none;
}
</style>
