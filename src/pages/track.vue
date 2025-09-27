<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import TrackDetail from '@/components/TrackDetail.vue';
import PlaylistCard from '@/components/PlaylistCard.vue';

interface ImageLike {
  url: string;
  width?: number;
  height?: number;
}

interface ArtistLike {
  name: string;
}

interface TrackLike {
  id?: string;
  uri?: string;
  name?: string;
  album?: {
    images?: ImageLike[];
  };
  artists?: ArtistLike[];
}

interface PlaylistSummary {
  id: string;
  name: string;
  tracks: Array<{
    id: string;
    name: string;
    artists: string[];
  }>;
}

const maxPlaylistTracks = 25;

const router = useRouter();
const spotifyAuth = useSpotifyAuth();
const { status, client, error } = spotifyAuth;

const loading = ref(false);
const apiError = ref<Error | null>(null);
const track = ref<TrackLike | null>(null);
const deviceId = ref<string | null>(null);
const playlist = ref<PlaylistSummary | null>(null);
const playlistLoading = ref(false);
const playlistError = ref<Error | null>(null);
const refreshTick = ref(0);

const isAuthenticating = computed(() => status?.value === 'authenticating');
const isAuthenticated = computed(() => status?.value === 'authenticated' && !!client?.value);

const albumImage = computed(() => {
  if (!track.value?.album?.images?.length) {
    return null;
  }

  // Spotify画像は通常サイズ順（大→小）で並んでいるため、適切なサイズを選択
  const images = track.value.album.images;
  return images[0].url;

  // 300x300前後のサイズを優先、なければ最初の画像を使用
  // const preferredImage = images.find(img =>
  //   img.width && img.height && img.width >= 250 && img.width <= 640
  // ) || images[0];

  // return preferredImage?.url ?? null;
});

const artistNames = computed(() => {
  if (!track.value?.artists?.length) {
    return '';
  }

  return track.value.artists.map((artist) => artist.name).join(', ');
});

const playlistLink = computed(() => {
  if (!playlist.value) {
    return null;
  }

  return `https://open.spotify.com/playlist/${playlist.value.id}`;
});

const playlistTracks = computed(() => playlist.value?.tracks ?? []);

const limitedPlaylistTracks = computed(() => playlistTracks.value.slice(0, maxPlaylistTracks));

const heroBackdropStyle = computed(() => {
  if (!albumImage.value) {
    return {} as Record<string, string>;
  }

  return {
    backgroundImage: `url(${albumImage.value})`,
  } as Record<string, string>;
});

const trackTitle = computed(() => track.value?.name ?? '現在再生中のトラックはありません');

const trackSubtitle = computed(() =>
  track.value
    ? artistNames.value || 'アーティスト情報が取得できませんでした'
    : 'Spotify を再生して現在のトラックをここに表示しましょう。'
);

const deviceStatus = computed(() => {
  if (deviceId.value) {
    return {
      icon: 'mdi-speaker-wave',
      text: `再生デバイス ID: ${deviceId.value}`,
      tone: 'success',
    } as const;
  }

  return {
    icon: 'mdi-speaker-off',
    text: 'アクティブな Spotify デバイスが検出されません',
    tone: 'warning',
  } as const;
});

const statusChipColor = computed(() => {
  if (isAuthenticating?.value) {
    return 'info';
  }

  if (isAuthenticated?.value) {
    return 'success';
  }

  return 'warning';
});

const trackDetails = computed(() => [
  {
    label: 'トラック名',
    value: track.value?.name ?? '---',
    icon: 'mdi-music-note',
  },
  {
    label: 'アーティスト',
    value: artistNames.value || '---',
    icon: 'mdi-account-music',
  },
  {
    label: 'プレイリスト',
    value: playlist.value?.name ?? '---',
    icon: 'mdi-playlist-music',
  },
  {
    label: 'デバイス',
    value: deviceStatus.value.text,
    icon: deviceStatus.value.icon,
  },
]);

const playlistSummary = computed(() => {
  if (!playlist.value) {
    return 'プレイリスト情報はありません';
  }

  return `${playlistTracks.value.length} 曲のプレイリスト`;
});

const showPlaylistLimitNotice = computed(
  () => !!playlist.value && playlistTracks.value.length > maxPlaylistTracks
);

const playbackButtonDisabled = computed(() => !isAuthenticated?.value || loading.value);

watch(
  () => status?.value,
  (currentStatus) => {
    if (currentStatus === 'idle' || currentStatus === 'error') {
      router.replace('/login');
    }
  },
  { immediate: true }
);

let fetchToken = 0;

const loadTrackData = async () => {
  const spotifyClient = client?.value;
  const authenticated = isAuthenticated?.value;

  if (!spotifyClient || !authenticated) {
    track.value = null;
    deviceId.value = null;
    playlist.value = null;
    playlistLoading.value = false;
    loading.value = false;
    return;
  }

  const token = ++fetchToken;
  loading.value = true;
  apiError.value = null;
  playlistError.value = null;
  playlist.value = null;
  playlistLoading.value = false;

  try {
    const response = await spotifyClient.player.getCurrentlyPlayingTrack();

    if (token !== fetchToken) {
      return;
    }

    deviceId.value = response?.device?.id ?? null;
    track.value = (response && 'item' in response ? (response.item as TrackLike) : null) ?? null;


    const context = response?.context;

    if (context?.type === 'playlist' && typeof context.uri === 'string') {
      const playlistId = context.uri.split(':').pop() ?? '';

      if (playlistId) {
        playlistLoading.value = true;

        try {
          const playlistResponse = await spotifyClient.playlists.getPlaylist(playlistId);

          if (token !== fetchToken) {
            return;
          }

          const items = playlistResponse.tracks?.items ?? [];

          const tracks = items
            .map((item, index) => {
              const playlistTrack = item?.track as TrackLike | null;
              if (!playlistTrack) {
                return null;
              }

              const trackId = playlistTrack.id ?? playlistTrack.uri ?? `playlist-track-${index}`;

              return {
                id: trackId,
                name: playlistTrack.name ?? 'Unknown',
                artists:
                  playlistTrack.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
              };
            })
            .filter((item): item is PlaylistSummary['tracks'][number] => Boolean(item));

          playlist.value = {
            id: playlistResponse.id,
            name: playlistResponse.name,
            tracks,
          };
          playlistError.value = null;
        } catch (err) {
          if (token !== fetchToken) {
            return;
          }

          playlistError.value = err instanceof Error ? err : new Error(String(err));
          playlist.value = null;
        } finally {
          if (token === fetchToken) {
            playlistLoading.value = false;
          }
        }
      }
    }
  } catch (err) {
    if (token !== fetchToken) {
      return;
    }

    apiError.value = err instanceof Error ? err : new Error(String(err));
    track.value = null;
    deviceId.value = null;
    playlist.value = null;
  } finally {
    if (token === fetchToken) {
      loading.value = false;
    }
  }
};

watch(
  [() => client?.value, () => isAuthenticated?.value, () => refreshTick.value],
  loadTrackData,
  { immediate: true }
);

const goHome = () => {
  router.push('/');
};

const handleRefresh = () => {
  if (!isAuthenticated?.value || !client?.value) {
    return;
  }

  refreshTick.value += 1;
};

const ensureActivePlaybackDevice = async (): Promise<string | null> => {
  const spotifyClient = client?.value;

  if (!spotifyClient) {
    return null;
  }

  if (deviceId.value) {
    return deviceId.value;
  }

  try {
    const devices = await spotifyClient.player.getAvailableDevices();

    const activeDevice = devices.devices.find((device) => device.is_active && device.id);

    if (activeDevice?.id) {
      deviceId.value = activeDevice.id;
      return activeDevice.id;
    }

    const fallbackDevice = devices.devices.find((device) => device.id);

    if (fallbackDevice?.id) {
      try {
        await spotifyClient.player.transferPlayback([fallbackDevice.id], true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        deviceId.value = fallbackDevice.id;
        return fallbackDevice.id;
      } catch (err) {
        apiError.value = err instanceof Error ? err : new Error(String(err));
        return null;
      }
    }
  } catch (err) {
    apiError.value = err instanceof Error ? err : new Error(String(err));
    return null;
  }

  apiError.value = new Error(
    'アクティブなSpotifyデバイスが見つかりません。Spotifyを開いて再生を開始してください。'
  );

  return null;
};

const handleSkip = async (direction: 'previous' | 'next') => {
  if (!isAuthenticated?.value || !client?.value) {
    return;
  }

  try {
    loading.value = true;

    const targetDeviceId = await ensureActivePlaybackDevice();

    if (!targetDeviceId) {
      return;
    }

    const attemptSkip = async (device: string | null) => {
      if (!client?.value) {
        return;
      }

      if (direction === 'next') {
        if (device) {
          await client.value.player.skipToNext(device);
        } else {
          await (client.value.player.skipToNext as unknown as (device_id?: string) => Promise<void>)();
        }
      } else if (direction === 'previous') {
        if (device) {
          await client.value.player.skipToPrevious(device);
        } else {
          await (client.value.player.skipToPrevious as unknown as (device_id?: string) => Promise<void>)();
        }
      }
    };

    try {
      await attemptSkip(targetDeviceId);
      apiError.value = null;
      await loadTrackData();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (/502/.test(message) || /NO_ACTIVE_DEVICE/.test(message) || /Bad gateway/i.test(message)) {
        try {
          await attemptSkip(null);
          deviceId.value = null;
          apiError.value = null;
        } catch (retryErr) {
          apiError.value =
            retryErr instanceof Error ? retryErr : new Error(String(retryErr));
        }
      } else {
        apiError.value = err instanceof Error ? err : new Error(String(err));
      }

      await loadTrackData();
    }
  } finally {
    loading.value = false;
  }
};

const skipPrevious = () => handleSkip('previous');
const skipNext = () => handleSkip('next');
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
            :api-error="apiError"
          />
        </VCol>

        <VCol cols="12" md="6">
          <PlaylistCard
            :playlist="playlist"
            :loading="playlistLoading"
            :error="playlistError"
            :max-tracks="maxPlaylistTracks"
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
}

.track-hero--empty {
  background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(22, 52, 40, 0.35));
}

.track-hero__backdrop {
  position: absolute;
  inset: -30%;
  background-size: cover;
  background-position: center;
  opacity: 0.35;
  filter: blur(18px) saturate(130%);
  transform: scale(1.1);
}

.track-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(8, 11, 18, 0.95), rgba(8, 11, 18, 0.45));
}

.track-hero__container {
  position: relative;
  z-index: 1;
}

.track-hero__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.track-hero__home {
  color: rgba(255, 255, 255, 0.85) !important;
}

.track-hero__content {
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem;
  align-items: center;
}

.track-hero__art {
  width: 220px;
  height: 220px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  background: rgba(29, 185, 84, 0.12);
}

.track-hero__art img {
  width: 100%;
}

.track-hero__art--empty {
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.track-hero__info {
  flex: 1;
  min-width: 260px;
}

.track-hero__title {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 700;
  margin-bottom: 0.6rem;
}

.track-hero__subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 1.5rem;
}

.track-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.track-hero__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.track-hero__refresh {
  border-radius: 999px;
  padding-inline: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.track-hero__skip-group {
  display: flex;
  gap: 0.75rem;
}

.track-hero__skip {
  border-radius: 999px;
  min-width: 140px;
  backdrop-filter: blur(12px);
}

.track-hero__skip--light {
  color: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.track-hero__skip--light .v-icon {
  color: inherit;
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
