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

const configError = computed(() => error?.value);
</script>

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
