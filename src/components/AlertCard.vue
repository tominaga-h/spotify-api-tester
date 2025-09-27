<template>
  <VAlert
    v-if="visible"
    :type="type"
    variant="tonal"
    border="start"
    :class="alertClass"
  >
    {{ message }}
    <div v-if="details" class="text-body-2 mt-2">{{ details }}</div>
  </VAlert>
</template>

<script setup lang="ts">
interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  visible?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  details: '',
  visible: true,
  class: 'mb-6'
})

const alertClass = computed(() => props.class)
</script>

<style lang="scss">
.v-alert {
  background: var(--base-100) !important;
  border: var(--border-subtle) !important;
  border-radius: var(--radius-sharp) !important;
  box-shadow: var(--shadow-neumorphic-flat) !important;
}
</style>