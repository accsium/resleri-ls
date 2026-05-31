<script setup>
import { useFilters } from '../composables/useFilters'
import CharacterCard from './CharacterCard.vue'

const { pagedCharacters } = useFilters()
</script>

<template>
  <div class="card-grid">
    <CharacterCard
      v-for="entry in pagedCharacters"
      :key="entry.id"
      :index-entry="entry"
    />
  </div>
</template>

<style scoped>
.card-grid {
  width: 90%;
  max-width: 840px;
  margin: 0 auto;
  padding: 16px 0 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
</style>
