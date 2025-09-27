<template>
  <VCard class="playlist-card" elevation="12" rounded="xl">
    <div class="playlist-card__header">
      <div>
        <div class="text-subtitle-2 text-medium-emphasis text-white">Current Playlist Context</div>
        <div class="text-h5 font-weight-bold text-white">
          {{ playlist ? playlist.name : 'プレイリスト情報はありません' }}
        </div>
      </div>
      <VBtn
        v-if="playlistLink"
        variant="text"
        color="primary"
        prepend-icon="mdi-open-in-new"
        :href="playlistLink"
        target="_blank"
        rel="noopener"
      >
        Spotify で開く
      </VBtn>
    </div>

    <div v-if="loading" class="playlist-card__loading">
      <VProgressCircular indeterminate color="primary" class="mr-4" />
      <span>プレイリストを読み込み中です…</span>
    </div>

    <template v-else>
      <div v-if="playlist" class="playlist-tracks">
        <div
          v-for="(item, index) in limitedTracks"
          :key="item.id || `playlist-${index}`"
          class="playlist-track-item"
        >
          <div class="playlist-track-item__number">
            {{ index + 1 }}
          </div>
          <div class="playlist-track-item__content">
            <div class="playlist-track-item__name">
              {{ item.name }}
            </div>
            <div class="playlist-track-item__artist">
              {{ item.artists.length ? item.artists.join(', ') : 'アーティスト情報なし' }}
            </div>
          </div>
          <div class="playlist-track-item__icon">
            <VIcon icon="mdi-music-note" size="18" />
          </div>
        </div>

        <VAlert
          v-if="showLimitNotice"
          type="info"
          variant="tonal"
          border="start"
          class="mt-4"
        >
          最初の {{ maxTracks }} 曲を表示しています。完全なリストは Spotify で確認してください。
        </VAlert>
      </div>

      <div v-else class="playlist-card__empty text-medium-emphasis">
        現在のトラックはプレイリストに紐付いていません。
      </div>

      <VAlert
        v-if="error"
        type="warning"
        variant="tonal"
        border="start"
        class="mt-4"
      >
        {{ error.message }}
      </VAlert>
    </template>
  </VCard>
</template>

<script setup lang="ts">
interface PlaylistTrack {
  id: string
  name: string
  artists: string[]
}

interface PlaylistData {
  id: string
  name: string
  tracks: PlaylistTrack[]
}

interface Props {
  playlist: PlaylistData | null
  loading?: boolean
  error?: Error | null
  maxTracks?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  maxTracks: 25
})

const playlistLink = computed(() => {
  if (!props.playlist) {
    return null
  }
  return `https://open.spotify.com/playlist/${props.playlist.id}`
})

const limitedTracks = computed(() =>
  props.playlist?.tracks?.slice(0, props.maxTracks) ?? []
)

const showLimitNotice = computed(
  () => !!props.playlist && (props.playlist.tracks?.length ?? 0) > props.maxTracks
)
</script>

<style lang="scss">
.text-white {
  color: #fff !important;
}

.playlist-card {
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.playlist-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.playlist-card__loading {
  display: flex;
  align-items: center;
  border-radius: 18px;
  background: rgba(22, 28, 40, 0.85);
  padding: 1.2rem;
}

.playlist-tracks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.playlist-track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.playlist-track-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.playlist-track-item__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(29, 185, 84, 0.15);
  color: rgb(29, 185, 84);
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.playlist-track-item__content {
  flex: 1;
  min-width: 0;
}

.playlist-track-item__name {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
  word-break: break-word;
  line-height: 1.3;
}

.playlist-track-item__artist {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  word-break: break-word;
  line-height: 1.2;
}

.playlist-track-item__icon {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.playlist-card__empty {
  padding: 1.5rem;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

@media (max-width: 600px) {
  .playlist-track-item {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .playlist-track-item__number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .playlist-track-item__name {
    font-size: 0.9rem;
  }

  .playlist-track-item__artist {
    font-size: 0.75rem;
  }
}

@media (max-width: 600px) {
  .playlist-track-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .playlist-track-item__number {
    align-self: flex-start;
  }

  .playlist-track-item__icon {
    align-self: flex-end;
    margin-top: -1.5rem;
  }
}
</style>