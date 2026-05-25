<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  type: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="toggle-switch" :class="{ 'toggle-disabled': disabled }" :data-type="type" :title="disabled ? '' : title">
    <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="toggle">
    <span class="slider"></span>
  </label>
</template>
