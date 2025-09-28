<template>
  <button
    class="action-btn"
    :class="[
      `action-btn--${variant}`,
      { 'action-btn--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <VIcon v-if="icon" :icon="icon" :size="iconSize" />
    <span class="action-btn__text">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  icon?: string
  iconSize?: number | string
  text?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
  iconSize: 16,
  text: ''
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style lang="scss">
.action-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--base-100);
  border: var(--border-subtle);
  border-radius: var(--radius-sharp);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-variation-settings: 'wght' 500;
  color: var(--base-800);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-neumorphic-flat);

  &:hover:not(&--disabled) {
    background: var(--base-150);
    box-shadow: var(--shadow-neumorphic-pressed);
    transform: translateY(1px);
  }

  &:active:not(&--disabled) {
    box-shadow: var(--shadow-neumorphic-pressed);
    transform: translateY(2px);
  }

  &--primary {
    background: var(--gradient-neon-2);
    color: var(--base-white);
    border: 2px solid var(--neon-electric);
    box-shadow: var(--glow-electric);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--gradient-neon-3);
      opacity: 0;
      transition: opacity var(--duration-normal) var(--ease-out);
    }

    &:hover:not(.action-btn--disabled) {
      box-shadow: var(--glow-pink);
      animation: neonPulse 1s ease-in-out infinite;

      &::before {
        opacity: 1;
      }
    }
  }

  &--secondary {
    background: var(--base-200);
    color: var(--base-700);
    border: var(--border-muted);

    &:hover:not(.action-btn--disabled) {
      background: var(--base-250);
    }
  }

  &--outline {
    background: transparent;
    border: 2px solid var(--neon-purple);
    color: var(--neon-purple);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--gradient-neon-2);
      opacity: 0;
      transition: opacity var(--duration-normal) var(--ease-out);
    }

    &:hover:not(.action-btn--disabled) {
      background: var(--base-100);
      border-color: var(--neon-electric);
      color: var(--neon-electric);
      box-shadow: var(--glow-electric);
      animation: neonPulse 2s ease-in-out infinite;

      &::before {
        opacity: 0.1;
      }
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
  }

  &__text {
    position: relative;
    z-index: 1;
  }
}
</style>