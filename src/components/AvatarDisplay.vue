<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const { getTraitColorHex } = useI18n()
const { trackImage, imageDone } = useCharacterData()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
})

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)
const canvasSize = 360

const starLevel = { 1:1, 2:2, 3:3, 4:3.5, 5:4, 6:4.5, 7:5, 8:6 }
const starDisplayCount = computed(() => {
  const level = starLevel[props.indexEntry.initial_rarity] || 0
  const hasHalf = level !== Math.floor(level)
  return Math.floor(level) + (hasHalf ? 1 : 0)
})

const charImage = computed(() => `image/character/${props.indexEntry.id}.png`)
const showImage = ref(false)

onMounted(() => {
  const img = new Image()
  trackImage(0)
  img.onload = () => { showImage.value = true; imageDone(0) }
  img.onerror = () => { imageDone(0) }
  img.src = charImage.value
})
</script>

<template>
  <div class="avatar-component" :style="{ width: size + 'px', height: size + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (size / canvasSize) + ')', transformOrigin: '0 0' }">
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 360 360"
        xmlns="http://www.w3.org/2000/svg"
        style="overflow: visible;"
      >
        <defs>
          <filter :id="'glow-' + indexEntry.id" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" result="blur"/>
            <feComposite in="blur" in2="SourceGraphic" operator="over"/>
          </filter>
          <linearGradient :id="'gt-' + indexEntry.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gl-' + indexEntry.id" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gr-' + indexEntry.id" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <mask :id="'mask-' + indexEntry.id">
            <polygon points="52,74 308,74 308,202 180,330 52,202" fill="white"/>
            <rect x="52" y="74" width="256" height="15" :fill="'url(#gt-' + indexEntry.id + ')'"/>
            <rect x="52" y="74" width="15" height="128" :fill="'url(#gl-' + indexEntry.id + ')'"/>
            <rect x="293" y="74" width="15" height="128" :fill="'url(#gr-' + indexEntry.id + ')'"/>
          </mask>
        </defs>
        <polygon points="180,10 10,180 180,350" :fill="traitHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="180,10 350,180 180,350" :fill="supportHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="180,30 30,180 180,330" :fill="traitHex"/>
        <polygon points="180,30 330,180 180,330" :fill="supportHex"/>
        <image
          :href="showImage ? charImage : 'image/misc/00000.png'"
          x="52" y="74" width="256" height="256"
          :mask="'url(#mask-' + indexEntry.id + ')'"
          preserveAspectRatio="xMidYMax meet"
        />
      </svg>
      <!-- 图标容器：无缩放居中 -->
      <div v-if="roleId" class="overlay-icon overlay-icon-left">
        <IconDisplay type="role" :id="roleId" :size="128" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right">
        <IconDisplay type="attribute" :id="attributeId" :size="128" />
      </div>
      <!-- 初始星星 -->
      <div v-if="starDisplayCount > 0"
        :style="{
          position: 'absolute',
          left: ((canvasSize - starDisplayCount * 45 * 1.5) / 2) + 'px',
          top: (canvasSize - 45 * 1.5 - 10) + 'px',
        }"
      >
        <StarsDisplay :mode="1" :rarity="indexEntry.initial_rarity" :max-rarity="indexEntry.max_rarity" :scale="1.5" />
      </div>
    </div>
  </div>
</template>
