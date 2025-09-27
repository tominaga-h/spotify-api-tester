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
    <div class="app-background">
      <div class="gradient gradient--primary" />
      <div class="gradient gradient--accent" />
    </div>
    <VMain class="app-main">
      <NuxtLoadingIndicator color="#1db954" />
      <div class="app-wrapper">
        <VFadeTransition mode="out-in">
          <div v-if="configError" key="config-error" class="config-error">
            <VAlert
              type="error"
              border="start"
              variant="tonal"
              class="config-error__alert"
            >
              <div class="text-h5 font-weight-bold mb-3">Spotify 環境設定エラー</div>
              <p class="mb-2">{{ configError.message }}</p>
              <p class="mb-0">
                <code>NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code>
                など環境変数を設定してください。
              </p>
            </VAlert>
          </div>
          <NuxtPage v-else key="page" />
        </VFadeTransition>
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
  position: relative;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.5rem 0;
  position: relative;
  z-index: 1;
}

.config-error {
  max-width: 720px;
  margin: 0 auto;
}

.config-error__alert {
  backdrop-filter: blur(16px);
  background: rgba(31, 33, 46, 0.8);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
}

.app-background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.gradient {
  position: absolute;
  filter: blur(90px);
  opacity: 0.75;
  mix-blend-mode: screen;
  transform: translate3d(0, 0, 0);
  transition: opacity 0.6s ease;
}

.gradient--primary {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(29, 185, 84, 0.85) 0%, rgba(18, 91, 52, 0.05) 70%);
}

.gradient--accent {
  width: 360px;
  height: 360px;
  bottom: -120px;
  left: -60px;
  background: radial-gradient(circle, rgba(30, 215, 96, 0.65) 0%, rgba(16, 47, 36, 0.05) 70%);
}

code {
  font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
