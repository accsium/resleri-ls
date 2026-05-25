<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  type: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="toggle-switch" :data-type="type" :title="title">
    <input type="checkbox" :checked="modelValue" @change="toggle">
    <span class="slider"></span>
  </label>
</template>
