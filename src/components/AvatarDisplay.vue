<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
})

const { getField, getColorHex } = useI18n()

const traitColor = computed(() => getField(props.indexEntry, 'trait_color_name'))
const supportColor = computed(() => getField(props.indexEntry, 'support_color_name'))
const traitHex = computed(() => getColorHex(traitColor.value))
const supportHex = computed(() => getColorHex(supportColor.value))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)
const canvasSize = 360
const imageOK = ref(false)

const starCountMap = { 1: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6 }
const initialStars = computed(() => starCountMap[props.indexEntry.initial_rarity] || 0)
const imageSrc = computed(() => `image/character/${props.indexEntry.id}.png`)
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
          :href="imageOK ? imageSrc : 'image/misc/00000.png'"
          x="52" y="74" width="256" height="256"
          :mask="'url(#mask-' + indexEntry.id + ')'"
          preserveAspectRatio="xMidYMax meet"
          @load="imageOK = true"
          @error="imageOK = false"
        />
      </svg>
      <!-- 职业图标 -->
      <div v-if="roleId" style="position: absolute; left: 0; top: 0;">
        <img
          :src="'image/misc/role_' + roleId + '.png'" alt=""
          :style="{ width: '96px', height: '96px', position: 'relative', left: '16px', top: '16px' }"
        >
      </div>
      <!-- 属性图标 -->
      <div v-if="attributeId" style="position: absolute; left: 0; top: 0;">
        <img
          :src="'image/misc/attack_attribute_' + attributeId + '.png'" alt=""
          :style="{ width: '118px', height: '112px', position: 'relative', left: (canvasSize - 118 - 16) + 'px', top: '8px' }"
        >
      </div>
      <!-- 初始星星 -->
      <div v-if="initialStars > 0" style="position: absolute; left: 0; top: 0;">
        <div :style="{
          position: 'absolute',
          left: ((canvasSize - initialStars * (67 - 20) * 1.5) / 2) + 'px',
          top: (canvasSize - 64 * 1.5) + 'px',
          width: (initialStars * (67 - 20) * 1.5) + 'px',
          height: (64 * 1.5) + 'px',
          overflow: 'visible'
        }">
          <img
            v-for="i in initialStars" :key="i"
            :src="'image/misc/star_' + (props.indexEntry.initial_rarity === 8 ? '2' : '1') + '.png'"
            style="position: absolute;"
            :style="{
              left: ((i - 1) * (67 - 20) * 1.5 - 10 * 1.5) + 'px',
              top: 0,
              width: (67 * 1.5) + 'px',
              height: (64 * 1.5) + 'px'
            }"
          >
        </div>
      </div>
    </div>
  </div>
</template>
