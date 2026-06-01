<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const { getTraitColorHex } = useI18n()
const { trackImage, imageDone, untrackImage } = useCharacterData()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
})

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)
const canvasSize = 320

const starLevel = { 1:1, 2:2, 3:3, 4:3.5, 5:4, 6:4.5, 7:5, 8:6 }
const starDisplayCount = computed(() => {
  const level = starLevel[props.indexEntry.initial_rarity] || 0
  const hasHalf = level !== Math.floor(level)
  return Math.floor(level) + (hasHalf ? 1 : 0)
})

const charImage = computed(() => `image/character/${props.indexEntry.id}.png`)
const showImage = ref(false)
const wasLoaded = ref(false)
const imageSize = props.indexEntry.image_size || 60000
let cancelled = false

onMounted(() => {
  cancelled = false
  const img = new Image()
  trackImage(imageSize)
  img.onload = () => {
    if (cancelled) return
    showImage.value = true; wasLoaded.value = true; imageDone(imageSize)
  }
  img.onerror = () => {
    if (cancelled) return
    imageDone(imageSize)
  }
  img.src = charImage.value
})

onUnmounted(() => {
  cancelled = true
  untrackImage(imageSize, wasLoaded.value)
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
        <defs>
          <filter :id="'glow-' + indexEntry.id" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" result="blur"/>
            <feComposite in="blur" in2="SourceGraphic" operator="over"/>
          </filter>
          <linearGradient :id="'gt-' + indexEntry.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black"/><stop offset="50%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gl-' + indexEntry.id" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="50%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gr-' + indexEntry.id" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="50%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <mask :id="'mask-' + indexEntry.id">
            <rect x="40" y="25" width="240" height="275" fill="white"/>
            <rect x="40" y="25" width="240" height="30" :fill="'url(#gt-' + indexEntry.id + ')'"/>
            <rect x="40" y="25" width="30" height="280" :fill="'url(#gl-' + indexEntry.id + ')'"/>
            <rect x="250" y="25" width="30" height="280" :fill="'url(#gr-' + indexEntry.id + ')'"/>
            <polygon points="55,190 160,295 265,190 265,320 55,320" fill="black"/>
          </mask>
        </defs>
        <polygon points="160,10 10,160 160,310" :fill="traitHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="160,10 310,160 160,310" :fill="supportHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="160,25 25,160 160,295" :fill="traitHex"/>
        <polygon points="160,25 295,160 160,295" :fill="supportHex"/>
        <image
          :href="showImage ? charImage : 'image/misc/00000.png'"
          x="32" y="39" width="256" height="256"
          :mask="'url(#mask-' + indexEntry.id + ')'"
          preserveAspectRatio="xMidYMax meet"
        />
      </svg>
      <!-- 图标容器：无缩放居中 -->
      <div v-if="roleId" class="overlay-icon overlay-icon-left">
        <IconDisplay type="role" :id="roleId" :size="100" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right">
        <IconDisplay type="attribute" :id="attributeId" :size="100" />
      </div>
      <!-- 初始星星 -->
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
