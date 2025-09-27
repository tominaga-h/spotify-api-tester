<template>
  <VApp>
    <VMain class="app-main">
      <NuxtLoadingIndicator color="#1db954" />
      <div class="app-wrapper">
        <div v-if="configError" class="config-error">
          <VCard color="error" variant="tonal" class="pa-6">
            <VCardTitle class="text-h5 mb-2">Spotify 環境設定エラー</VCardTitle>
            <VCardText>
              <p class="mb-2">{{ configError.message }}</p>
              <p>
                <code>NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code>
                など環境変数を設定してください。
              </p>
            </VCardText>
          </VCard>
        </div>
        <NuxtPage v-else />
      </div>
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

import { useSpotifyConfig } from '@/composables/useSpotifyConfig';
import { initSpotifyAuth } from '@/composables/useSpotifyAuth';

const { config, error } = useSpotifyConfig();

watch(
  config,
  (value) => {
    if (value) {
      initSpotifyAuth(value);
    }
  },
  { immediate: true }
);

const configError = computed(() => error.value);
</script>
