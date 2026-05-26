<script setup>
import StarsDisplay from '../components/StarsDisplay.vue'

const rarities = [1, 2, 3, 4, 5, 6, 7, 8]
</script>

<template>
  <div style="padding: 40px; display: flex; flex-direction: column; gap: 40px;">
    <div v-for="maxR in [7, 8]" :key="maxR">
      <h2 style="margin-bottom: 16px;">maxRarity = {{ maxR }}</h2>
      <table style="border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 12px;">rarity</th>
            <th style="padding: 8px 12px;">mode 1（仅当前星）</th>
            <th style="padding: 8px 12px;">mode 2（含空星）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rarities" :key="r">
            <td style="padding: 8px 12px; text-align: center;">{{ r }}</td>
            <td style="padding: 8px 12px;">
              <StarsDisplay :mode="1" :rarity="r" :max-rarity="maxR" />
            </td>
            <td style="padding: 8px 12px;">
              <StarsDisplay :mode="2" :rarity="r" :max-rarity="maxR" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
