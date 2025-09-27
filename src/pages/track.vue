<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';

interface ImageLike {
  url: string;
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
const { status, client, error } = useSpotifyAuth();

const loading = ref(false);
const apiError = ref<Error | null>(null);
const track = ref<TrackLike | null>(null);
const deviceId = ref<string | null>(null);
const playlist = ref<PlaylistSummary | null>(null);
const playlistLoading = ref(false);
const playlistError = ref<Error | null>(null);
const refreshTick = ref(0);

const isAuthenticating = computed(() => status.value === 'authenticating');
const isAuthenticated = computed(() => status.value === 'authenticated' && !!client.value);

const albumImage = computed(() => {
  if (!track.value?.album?.images?.length) {
    return null;
  }

  return track.value.album.images[0]?.url ?? null;
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

const limitedPlaylistTracks = computed(() => {
  if (!playlist.value) {
    return [];
  }

  return playlist.value.tracks.slice(0, maxPlaylistTracks);
});

watch(
  () => status.value,
  (currentStatus) => {
    if (currentStatus === 'idle' || currentStatus === 'error') {
      router.replace('/login');
    }
  },
  { immediate: true }
);

let fetchToken = 0;

watch(
  [() => client.value, () => isAuthenticated.value, () => refreshTick.value],
  async ([spotifyClient, authenticated]) => {
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
  },
  { immediate: true }
);

const goHome = () => {
  router.push('/');
};

const handleRefresh = () => {
  if (!isAuthenticated.value || !client.value) {
    return;
  }

  refreshTick.value += 1;
};

const ensureActivePlaybackDevice = async (): Promise<string | null> => {
  const spotifyClient = client.value;

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
  if (!isAuthenticated.value || !client.value) {
    return;
  }

  let shouldRefresh = false;

  try {
    loading.value = true;

    const targetDeviceId = await ensureActivePlaybackDevice();

    if (!targetDeviceId) {
      return;
    }

    const attemptSkip = async (device: string | null) => {
      if (!client.value) {
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
      shouldRefresh = true;
      apiError.value = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (/502/.test(message) || /NO_ACTIVE_DEVICE/.test(message) || /Bad gateway/i.test(message)) {
        try {
          await attemptSkip(null);
          shouldRefresh = true;
          deviceId.value = null;
          apiError.value = null;
        } catch (retryErr) {
          apiError.value =
            retryErr instanceof Error ? retryErr : new Error(String(retryErr));
        }
      } else {
        apiError.value = err instanceof Error ? err : new Error(String(err));
      }
    }
  } finally {
    loading.value = false;

    if (shouldRefresh) {
      refreshTick.value += 1;
    }
  }
};
</script>

<template>
  <VContainer class="py-8" max-width="960">
    <VRow>
      <VCol cols="12">
        <VSheet class="pa-6 mb-6" elevation="4" rounded="xl">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
            <div>
              <h1 class="text-h4 mb-1">Now Playing</h1>
              <div class="text-body-2 text-medium-emphasis">Spotifyの再生状況を表示</div>
            </div>
            <VBtn variant="text" color="primary" prepend-icon="mdi-home" @click="goHome">
              ホームへ戻る
            </VBtn>
          </div>

          <VAlert
            v-if="isAuthenticating"
            type="info"
            variant="tonal"
            border="start"
            class="mb-4"
          >
            Spotifyの認証完了を待機しています…
          </VAlert>

          <VAlert
            v-if="error.value"
            type="error"
            variant="tonal"
            border="start"
            class="mb-4"
          >
            {{ error.value.message }}
          </VAlert>

          <VAlert
            v-if="apiError"
            type="warning"
            variant="tonal"
            border="start"
            class="mb-4"
          >
            {{ apiError.message }}
          </VAlert>

          <div class="d-flex flex-wrap align-center gap-4 mb-6">
            <VBtn
              color="primary"
              variant="elevated"
              :disabled="!isAuthenticated || loading"
              :loading="loading"
              @click="handleRefresh"
            >
              リフレッシュ
            </VBtn>
            <div class="d-flex align-center gap-2">
              <VBtn
                color="secondary"
                variant="tonal"
                :disabled="!isAuthenticated || loading"
                @click="() => handleSkip('previous')"
              >
                ⏮ 前の曲
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                :disabled="!isAuthenticated || loading"
                @click="() => handleSkip('next')"
              >
                次の曲 ⏭
              </VBtn>
            </div>
          </div>

          <div v-if="loading" class="d-flex align-center gap-4 mb-4">
            <VProgressCircular indeterminate color="primary" />
            <span>トラック情報を取得しています…</span>
          </div>

          <div v-else-if="track">
            <div class="d-flex flex-wrap align-center gap-4">
              <VAvatar size="140" rounded="lg" v-if="albumImage">
                <VImg :src="albumImage" alt="Album artwork" cover />
              </VAvatar>
              <div>
                <div class="text-h5">{{ track.name ?? 'Unknown' }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ artistNames || 'Unknown artist' }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-medium-emphasis">
            現在再生中のトラックはありません。
          </div>
        </VSheet>
      </VCol>
    </VRow>

    <VRow>
      <VCol cols="12">
        <VSheet class="pa-6" elevation="2" rounded="xl">
          <h2 class="text-h5 mb-4">再生中のプレイリスト</h2>

          <VAlert
            v-if="playlistError"
            type="warning"
            variant="tonal"
            border="start"
            class="mb-4"
          >
            {{ playlistError.message }}
          </VAlert>

          <div v-if="playlistLoading" class="d-flex align-center gap-4">
            <VProgressCircular indeterminate color="primary" />
            <span>プレイリストを読み込み中…</span>
          </div>

          <template v-else-if="playlist">
            <p class="mb-4">
              プレイリスト:
              <template v-if="playlistLink">
                <NuxtLink
                  :to="playlistLink"
                  external
                  target="_blank"
                  class="font-weight-medium"
                >
                  {{ playlist.name }}
                </NuxtLink>
              </template>
              <template v-else>
                {{ playlist.name }}
              </template>
            </p>
            <VList class="rounded-lg" lines="two">
              <VListItem
                v-for="(item, index) in limitedPlaylistTracks"
                :key="item.id || `playlist-${index}`"
              >
                <VListItemTitle class="font-weight-medium">{{ item.name }}</VListItemTitle>
                <VListItemSubtitle v-if="item.artists.length">
                  {{ item.artists.join(', ') }}
                </VListItemSubtitle>
              </VListItem>
            </VList>
            <p v-if="playlist.tracks.length > maxPlaylistTracks" class="text-body-2 text-medium-emphasis mt-4">
              最初の {{ maxPlaylistTracks }} 曲を表示しています。完全なリストはSpotifyでご確認ください。
            </p>
          </template>

          <div v-else class="text-medium-emphasis">
            現在のトラックはプレイリスト由来ではありません。
          </div>
        </VSheet>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style lang="scss">
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #1a1f2a 0%, #0f1118 40%, #08090d 100%);
  color: #f5f5f5;
  min-height: 100vh;
}

.app-main {
  min-height: 100vh;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.config-error {
  max-width: 640px;
  margin: 0 auto;
}

code {
  font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
