<template>
  <div class="loading-spinner" :class="{ 'loading-spinner--overlay': overlay }">
    <VProgressCircular
      :indeterminate="indeterminate"
      :color="color"
      :size="size"
      :width="width"
    />
    <div v-if="text" class="loading-spinner__text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  indeterminate?: boolean
  color?: string
  size?: number | string
  width?: number | string
  text?: string
  overlay?: boolean
}

withDefaults(defineProps<Props>(), {
  indeterminate: true,
  color: 'primary',
  size: 32,
  width: 4,
  text: '',
  overlay: false
})
</script>

<style lang="scss">
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-spinner--overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.loading-spinner__text {
  color: var(--base-600);
  font-size: var(--text-sm);
  text-align: center;
}
</style>