<template>
  <div class="status-indicator" :class="`status-indicator--${chipColor}`">
    <div class="status-indicator__dot"></div>
    <span class="status-indicator__text">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'authenticated' | 'authenticating' | 'error' | 'idle'
}

const props = defineProps<Props>()

const statusMeta = computed(() => {
  switch (props.status) {
    case 'authenticated':
      return {
        label: 'Authenticated',
        chipColor: 'success',
        icon: 'mdi-check-circle',
        description:
          'Spotify Web API に接続されています。音楽データの取得や再生コントロールが利用できます。',
      } as const
    case 'authenticating':
      return {
        label: 'Spotifyへリダイレクト中…',
        chipColor: 'info',
        icon: 'mdi-timer-sand',
        description:
          'Spotify 認証フローにリダイレクトしています。ブラウザのポップアップをご確認ください。',
      } as const
    case 'error':
      return {
        label: '認証に失敗しました',
        chipColor: 'error',
        icon: 'mdi-alert-circle',
        description:
          '認証が完了しませんでした。クライアント設定をご確認のうえ再試行してください。',
      } as const
    default:
      return {
        label: '未認証です',
        chipColor: 'warning',
        icon: 'mdi-lock-alert',
        description: 'まだ Spotify にサインインしていません。下のボタンからログインしてください。',
      } as const
  }
})

const label = computed(() => statusMeta.value?.label ?? '未認証です')
const chipColor = computed(() => statusMeta.value?.chipColor ?? 'warning')
</script>

<style lang="scss">
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.status-indicator__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--base-500);
  transition: background-color var(--duration-normal) var(--ease-out);
}

.status-indicator--success .status-indicator__dot {
  background: var(--status-success);
  box-shadow: var(--glow-green);
  animation: neonPulse 2s ease-in-out infinite;
}

.status-indicator--warning .status-indicator__dot {
  background: var(--status-warning);
}

.status-indicator--error .status-indicator__dot {
  background: var(--status-error);
}

.status-indicator--info .status-indicator__dot {
  background: var(--status-info);
}

.status-indicator__text {
  font-size: var(--text-sm);
  color: var(--base-600);
  font-variation-settings: 'wght' 500;
}
</style>