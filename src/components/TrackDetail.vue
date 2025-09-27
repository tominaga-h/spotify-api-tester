<template>
  <VCard class="track-card" elevation="12" rounded="xl">
    <div class="track-card__header">
      <div>
        <div class="text-subtitle-2 text-medium-emphasis text-white">Playback Snapshot</div>
        <div class="text-h5 font-weight-bold text-white">再生情報の概要</div>
      </div>
    </div>

    <div class="track-details-grid">
      <div
        v-for="item in trackDetails"
        :key="item.label"
        class="track-detail-card"
      >
        <div class="track-detail-card__icon">
          <VIcon :icon="item.icon" size="24" />
        </div>
        <div class="track-detail-card__content">
          <div class="track-detail-card__label">{{ item.label }}</div>
          <div class="track-detail-card__value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="track-card__alerts">
      <VAlert
        v-if="authError"
        type="error"
        variant="tonal"
        border="start"
        class="mb-3"
      >
        {{ authError.message }}
      </VAlert>

      <VAlert
        v-if="apiError"
        type="warning"
        variant="tonal"
        border="start"
        class="mb-3"
      >
        {{ apiError.message }}
      </VAlert>
    </div>
  </VCard>
</template>

<script setup lang="ts">
interface TrackDetailProps {
  trackName?: string
  artistName?: string
  playlistName?: string
  deviceText?: string
  deviceIcon?: string
  authError?: Error | null
  apiError?: Error | null
}

const props = withDefaults(defineProps<TrackDetailProps>(), {
  trackName: '---',
  artistName: '---',
  playlistName: '---',
  deviceText: 'デバイス情報がありません',
  deviceIcon: 'mdi-speaker-off',
  authError: null,
  apiError: null
})

const trackDetails = computed(() => [
  {
    label: 'トラック名',
    value: props.trackName,
    icon: 'mdi-music-note',
  },
  {
    label: 'アーティスト',
    value: props.artistName,
    icon: 'mdi-account-music',
  },
  {
    label: 'プレイリスト',
    value: props.playlistName,
    icon: 'mdi-playlist-music',
  },
  {
    label: 'デバイス',
    value: props.deviceText,
    icon: props.deviceIcon,
  },
])
</script>

<style lang="scss">
.text-white {
  color: #fff !important;
}

.track-card {
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.track-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.track-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.track-detail-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.track-detail-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.track-detail-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(29, 185, 84, 0.15);
  color: rgb(29, 185, 84);
  flex-shrink: 0;
}

.track-detail-card__content {
  flex: 1;
  min-width: 0;
}

.track-detail-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.track-detail-card__value {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.track-card__alerts {
  margin-top: auto;
}

@media (max-width: 960px) {
  .track-details-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .track-detail-card {
    padding: 1rem;
  }

  .track-detail-card__icon {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 600px) {
  .track-detail-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .track-detail-card__content {
    text-align: center;
  }
}
</style>