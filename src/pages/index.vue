<template>
  <VContainer class="py-8" max-width="960">
    <VRow>
      <VCol cols="12">
        <VSheet class="pa-6 mb-6" elevation="4" rounded="xl">
          <header>
            <div class="d-flex align-center justify-space-between flex-wrap gap-4">
              <div>
                <h1 class="text-h4 mb-2">Spotify OAuth Nuxt Demo</h1>
                <p class="text-body-2 mb-0">Nuxt 3 + Vuetify + Spotify Web API TS SDK</p>
              </div>
              <VBtn
                color="primary"
                size="large"
                @click="handleNavigateToLogin"
              >
                {{ status.value === 'authenticated' ? '再認証' : 'Spotifyでログイン' }}
              </VBtn>
            </div>
          </header>

          <VDivider class="my-6" />

          <VRow>
            <VCol cols="12" md="4">
              <strong>Client ID</strong>
              <p class="text-body-2 mb-0">
                <code>{{ config.value?.clientId }}</code>
              </p>
            </VCol>
            <VCol cols="12" md="4">
              <strong>Redirect URI</strong>
              <p class="text-body-2 mb-0">
                <code>{{ config.value?.redirectUri }}</code>
              </p>
            </VCol>
            <VCol cols="12" md="4">
              <strong>Scopes</strong>
              <p class="text-body-2 mb-0">
                <code>{{ config.value?.scopes.join(', ') }}</code>
              </p>
            </VCol>
          </VRow>
        </VSheet>
      </VCol>
    </VRow>

    <VRow>
      <VCol cols="12" md="6">
        <VSheet class="pa-6" elevation="2" rounded="xl">
          <h2 class="text-h5 mb-4">認証状態</h2>
          <p class="text-body-1 mb-4">{{ statusLabel }}</p>
          <VAlert
            v-if="error.value"
            type="error"
            variant="tonal"
            border="start"
            class="mb-4"
          >
            {{ error.value.message }}
          </VAlert>
          <VBtn
            color="secondary"
            variant="tonal"
            :loading="status.value === 'authenticating'"
            @click="handleNavigateToLogin"
          >
            {{ status.value === 'authenticated' ? '再認証' : 'Spotifyでログイン' }}
          </VBtn>
        </VSheet>
      </VCol>

      <VCol cols="12" md="6">
        <VSheet class="pa-6" elevation="2" rounded="xl">
          <h2 class="text-h5 mb-4">プロフィール</h2>
          <div v-if="loadingProfile" class="d-flex align-center">
            <VProgressCircular indeterminate color="primary" class="mr-4" />
            <span>読み込み中...</span>
          </div>
          <div v-else-if="profile">
            <div class="d-flex align-center gap-4 mb-4">
              <VAvatar size="96" v-if="profile.images?.[0]?.url">
                <VImg :src="profile.images[0].url" alt="Spotify avatar" />
              </VAvatar>
              <div>
                <div class="text-h6">{{ profile.display_name }}</div>
                <div class="text-body-2">{{ profile.email }}</div>
                <div class="text-caption text-medium-emphasis">ID: {{ profile.id }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">
            プロフィールはまだ取得されていません。
          </div>
        </VSheet>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <VCol cols="12">
        <VSheet class="pa-6" elevation="2" rounded="xl">
          <h2 class="text-h5 mb-4">Now Playing</h2>
          <p class="mb-4">再生中のトラックを確認するには「Now Playing」ページへ移動してください。</p>
          <VBtn color="primary" variant="outlined" @click="navigateToTrack">
            Now Playing ページへ
          </VBtn>
        </VSheet>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';

interface SpotifyProfile {
  display_name: string;
  email: string;
  id: string;
  images?: { url: string }[];
}

const router = useRouter();
const { config, status, error, client, logOut } = useSpotifyAuth();

const profile = ref<SpotifyProfile | null>(null);
const loadingProfile = ref(false);

watch(
  () => client.value,
  async (spotifyClient) => {
    if (!spotifyClient) {
      profile.value = null;
      loadingProfile.value = false;
      return;
    }

    loadingProfile.value = true;
    try {
      const profileResponse = await spotifyClient.currentUser.profile();
      profile.value = profileResponse as SpotifyProfile;
    } catch (err) {
      console.error(err);
      profile.value = null;
    } finally {
      loadingProfile.value = false;
    }
  },
  { immediate: true }
);

const statusLabel = computed(() => {
  switch (status.value) {
    case 'authenticated':
      return 'Authenticated';
    case 'authenticating':
      return 'Spotifyへリダイレクト中…';
    case 'error':
      return '認証に失敗しました';
    default:
      return '未認証です';
  }
});

const handleNavigateToLogin = async () => {
  if (status.value === 'authenticated') {
    logOut();
    await router.push({ path: '/login', query: { reauthenticate: '1' } });
    return;
  }

  await router.push('/login');
};

const navigateToTrack = () => {
  router.push('/track');
};
</script>
