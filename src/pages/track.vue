<script setup lang="ts">
import { computed, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import { useSpotifyTrack } from '@/composables/useSpotifyTrack';
import { useSpotifyPlaylist } from '@/composables/useSpotifyPlaylist';
import TrackDetail from '@/components/TrackDetail.vue';
import PlaylistCard from '@/components/PlaylistCard.vue';

const router = useRouter();
const { status, error } = useSpotifyAuth();

const {
  track,
  device,
  context,
  albumImage,
  artistNames,
  trackTitle,
  trackSubtitle,
  deviceStatus,
  loading,
  error: apiError,
  controlLoading,
  controlError,
  refresh: refreshTrack,
  skipNext,
  skipPrevious
} = useSpotifyTrack();

const contextUri = computed(() => context.value?.uri)

const {
  playlist,
  playlistLink,
  playlistSummary,
  limitedTracks,
  showLimitNotice,
  maxTracksDisplayed,
  loading: playlistLoading,
  error: playlistError
} = useSpotifyPlaylist(contextUri);

const isAuthenticating = computed(() => status?.value === 'authenticating');
const isAuthenticated = computed(() => status?.value === 'authenticated');

// Watch for status changes and redirect if needed
watch(
  () => status?.value,
  (currentStatus) => {
    if (currentStatus === 'idle' || currentStatus === 'error') {
      router.replace('/login');
    }
  },
  { immediate: true }
);

const statusChipColor = computed(() => {
  if (isAuthenticating?.value) {
    return 'info';
  }

  if (isAuthenticated?.value) {
    return 'success';
  }

  return 'warning';
});

const heroBackdropStyle = computed(() => {
  if (!albumImage.value) {
    return {} as Record<string, string>;
  }

  return {
    backgroundImage: `url(${albumImage.value})`,
  } as Record<string, string>;
});

const playbackButtonDisabled = computed(() => !isAuthenticated?.value || loading.value || controlLoading.value);

const goHome = () => {
  router.push('/');
};

const handleRefresh = () => {
  if (!isAuthenticated?.value) {
    return;
  }
  refreshTrack();
};

</script>

<template>
  <div class="track-page">
    <section class="track-hero" :class="{ 'track-hero--empty': !track }">
      <div class="track-hero__backdrop" :style="heroBackdropStyle" />
      <div class="track-hero__overlay" />
      <VContainer class="track-hero__container py-10" max-width="1200">
        <div class="track-hero__header">
          <VChip :color="statusChipColor" variant="tonal" prepend-icon="mdi-account-music">
            {{ isAuthenticated ? 'Connected' : isAuthenticating ? 'Authenticating…' : 'Awaiting login' }}
          </VChip>
          <VBtn variant="text" color="surface" class="track-hero__home" prepend-icon="mdi-home" @click="goHome">
            ホームへ戻る
          </VBtn>
        </div>

        <div class="track-hero__content">
          <div class="track-hero__art" :class="{ 'track-hero__art--empty': !albumImage }">
            <template v-if="albumImage">
              <img :src="albumImage" alt="Album artwork" />
            </template>
            <template v-else>
              <VIcon icon="mdi-music-box-outline" size="96" />
            </template>
          </div>

          <div class="track-hero__info">
            <h1 class="track-hero__title">{{ trackTitle }}</h1>
            <p class="track-hero__subtitle">{{ trackSubtitle }}</p>

            <div class="track-hero__chips">
              <VChip :color="deviceStatus.tone" variant="tonal" :prepend-icon="deviceStatus.icon">
                {{ deviceStatus.text }}
              </VChip>
              <VChip
                v-if="playlist"
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-playlist-music"
              >
                {{ playlistSummary }}
              </VChip>
            </div>

            <div class="track-hero__controls">
              <VBtn
                color="primary"
                size="large"
                elevation="6"
                class="track-hero__refresh"
                :disabled="playbackButtonDisabled"
                :loading="loading"
                @click="handleRefresh"
              >
                <VIcon start icon="mdi-sync" />
                リフレッシュ
              </VBtn>
              <div class="track-hero__skip-group">
                <VBtn
                  color="surface"
                  variant="tonal"
                  class="track-hero__skip track-hero__skip--light"
                  :disabled="playbackButtonDisabled"
                  @click="skipPrevious"
                >
                  <VIcon start icon="mdi-skip-previous" />
                  前の曲
                </VBtn>
                <VBtn
                  color="surface"
                  variant="tonal"
                  class="track-hero__skip track-hero__skip--light"
                  :disabled="playbackButtonDisabled"
                  @click="skipNext"
                >
                  次の曲
                  <VIcon end icon="mdi-skip-next" />
                </VBtn>
              </div>
            </div>
          </div>
        </div>
      </VContainer>
    </section>

    <VContainer class="track-content py-10" max-width="1200">
      <VRow align="stretch" class="g-6">
        <VCol cols="12" md="6">
          <TrackDetail
            :track-name="track?.name"
            :artist-name="artistNames || undefined"
            :playlist-name="playlist?.name"
            :device-text="deviceStatus.text"
            :device-icon="deviceStatus.icon"
            :auth-error="error"
            :api-error="apiError || controlError"
          />
        </VCol>

        <VCol cols="12" md="6">
          <PlaylistCard
            :playlist="playlist"
            :loading="playlistLoading"
            :error="playlistError"
            :max-tracks="maxTracksDisplayed"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style lang="scss">
.text-white {
  color: #fff !important;
}

.track-page {
  position: relative;
  min-height: 100vh;
}

.track-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(12, 18, 26, 0.95), rgba(29, 185, 84, 0.18));
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &--empty {
    background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(22, 52, 40, 0.35));
  }

  &__backdrop {
    position: absolute;
    inset: -30%;
    background-size: cover;
    background-position: center;
    opacity: 0.35;
    filter: blur(18px) saturate(130%);
    transform: scale(1.1);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(8, 11, 18, 0.95), rgba(8, 11, 18, 0.45));
  }

  &__container {
    position: relative;
    z-index: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  &__home {
    color: rgba(255, 255, 255, 0.85) !important;
  }

  &__content {
    display: flex;
    flex-wrap: wrap;
    gap: 2.5rem;
    align-items: center;
  }

  &__art {
    width: 220px;
    height: 220px;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    background: rgba(29, 185, 84, 0.12);

    img {
      width: 100%;
    }

    &--empty {
      border: 2px dashed rgba(255, 255, 255, 0.2);
    }
  }

  &__info {
    flex: 1;
    min-width: 260px;
  }

  &__title {
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    font-weight: 700;
    margin-bottom: 0.6rem;
  }

  &__subtitle {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.75);
    margin-bottom: 1.5rem;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  &__refresh {
    border-radius: 999px;
    padding-inline: 1.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  &__skip-group {
    display: flex;
    gap: 0.75rem;
  }

  &__skip {
    border-radius: 999px;
    min-width: 140px;
    backdrop-filter: blur(12px);

    &--light {
      color: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid rgba(255, 255, 255, 0.12);

      .v-icon {
        color: inherit;
      }
    }
  }
}

.track-content {
  position: relative;
  z-index: 2;
}

.track-card,
.playlist-card {
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.track-card__header,
.playlist-card__header {
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

@media (max-width: 960px) {
  .track-hero__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .track-hero__art {
    width: 180px;
    height: 180px;
  }

  .track-hero__controls {
    width: 100%;
  }

  .track-hero__refresh,
  .track-hero__skip {
    flex: 1;
  }

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
  .track-detail-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .track-detail-card__content {
    text-align: center;
  }

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
