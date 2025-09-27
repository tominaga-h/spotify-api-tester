<template>
  <VContainer class="fill-height" max-width="640">
    <VRow class="fill-height" align="center" justify="center">
      <VCol cols="12">
        <VCard elevation="6" class="pa-6" rounded="xl">
          <VCardTitle class="text-h5 mb-2">Spotify OAuth Nuxt Demo</VCardTitle>
          <VCardText>
            <template v-if="status.value === 'error'">
              <VAlert type="error" variant="tonal" border="start" class="mb-4">
                認証に失敗しました。
              </VAlert>
              <div v-if="error.value" class="text-body-2 text-medium-emphasis">
                {{ error.value.message }}
              </div>
            </template>
            <template v-else>
              <div class="d-flex align-center gap-4">
                <VProgressCircular
                  v-if="status.value === 'authenticating'"
                  indeterminate
                  color="primary"
                />
                <div>
                  <p class="mb-1">Spotifyへリダイレクトしています…</p>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    自動的に遷移しない場合はポップアップを許可してください。
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

<script setup lang="ts">
import { ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';

const router = useRouter();
const { status, error, authenticate } = useSpotifyAuth();

const started = ref(false);

watch(
  () => status.value,
  (currentStatus) => {
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

watch(
  () => status.value,
  (currentStatus) => {
    if (currentStatus === 'error') {
      started.value = false;
    }
  }
);
</script>
