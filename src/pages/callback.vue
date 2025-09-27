<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';

const router = useRouter();
const route = useRoute();
const { status, error, authenticate } = useSpotifyAuth();

const started = ref(false);
const hasCode = computed(() => typeof route.query.code === 'string');

watch(
  () => hasCode.value,
  (value) => {
    if (!value) {
      router.replace('/');
    }
  },
  { immediate: true }
);

watch(
  () => status.value,
  (currentStatus) => {
    if (!hasCode.value) {
      return;
    }

    if (currentStatus === 'authenticated') {
      router.replace('/');
      return;
    }

    if (started.value || currentStatus === 'authenticating') {
      return;
    }

    started.value = true;
    authenticate().catch((err) => {
      console.error(err);
    });
  },
  { immediate: true }
);
</script>

<template>
  <VContainer class="fill-height" max-width="640">
    <VRow class="fill-height" align="center" justify="center">
      <VCol cols="12">
        <VCard elevation="6" class="pa-6" rounded="xl">
          <VCardTitle class="text-h5 mb-2">Spotify 認証処理中</VCardTitle>
          <VCardText>
            <template v-if="status.value === 'error'">
              <VAlert type="error" variant="tonal" border="start" class="mb-4">
                認証の完了に失敗しました。
              </VAlert>
              <div v-if="error.value" class="text-body-2 text-medium-emphasis">
                {{ error.value.message }}
              </div>
            </template>
            <template v-else>
              <div class="d-flex align-center gap-4">
                <VProgressCircular indeterminate color="primary" />
                <div>
                  <p class="mb-1">Spotifyログインを完了しています…</p>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    数秒お待ちください。
                  </p>
                </div>
              </div>
            </template>
          </VCardText>
        </VCard>
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
