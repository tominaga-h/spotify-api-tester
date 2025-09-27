<script setup lang="ts">
import { computed, ref, watch } from 'vue';

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

const isAuthenticating = computed(() => status.value === 'authenticating');
const isError = computed(() => status.value === 'error');
</script>

<template>
  <div class="login-page">
    <div class="login-background">
      <div class="login-background__gradient login-background__gradient--primary" />
      <div class="login-background__gradient login-background__gradient--secondary" />
    </div>
    <VContainer class="fill-height" max-width="960">
      <VRow class="fill-height" align="center" justify="center">
        <VCol cols="12" md="8" lg="6">
          <VCard class="login-card" elevation="16" rounded="xl">
            <div class="login-card__header">
              <VAvatar size="64" class="login-card__avatar" color="primary" variant="tonal">
                <VIcon icon="mdi-spotify" size="38" />
              </VAvatar>
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Spotify OAuth Nuxt Demo</div>
                <div class="text-h4 font-weight-bold">Spotify 認証を開始します</div>
              </div>
            </div>

            <VAlert
              v-if="isError"
              type="error"
              variant="tonal"
              border="start"
              class="mb-6"
            >
              認証に失敗しました。環境設定を見直し、もう一度お試しください。
              <div v-if="error.value" class="text-body-2 mt-2">{{ error.value.message }}</div>
            </VAlert>

            <div v-else class="login-card__status">
              <VAvatar size="72" class="login-card__status-avatar" color="success" variant="tonal">
                <VProgressCircular
                  v-if="isAuthenticating"
                  indeterminate
                  color="primary"
                  size="42"
                  width="4"
                />
                <VIcon v-else icon="mdi-shield-lock" size="40" />
              </VAvatar>
              <div>
                <div class="text-h5 mb-1">
                  {{ isAuthenticating ? 'Spotify に接続しています…' : 'リダイレクトを準備しています' }}
                </div>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  自動的に遷移しない場合はブラウザのポップアップを許可するか、再度ボタンを押してください。
                </p>
              </div>
            </div>

            <div class="login-card__actions">
              <VBtn
                color="primary"
                size="large"
                block
                :loading="isAuthenticating"
                class="login-card__button"
                @click="authenticate()"
              >
                <VIcon start icon="mdi-open-in-new" />
                Spotify でログイン
              </VBtn>
              <div class="text-caption text-medium-emphasis text-center">
                認証には Spotify のアカウントが必要です。承認後、自動的に元の画面へ戻ります。
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.login-background__gradient {
  position: absolute;
  width: 420px;
  height: 420px;
  filter: blur(90px);
  opacity: 0.8;
}

.login-background__gradient--primary {
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(29, 185, 84, 0.8), rgba(10, 26, 21, 0));
}

.login-background__gradient--secondary {
  bottom: -100px;
  right: -60px;
  background: radial-gradient(circle, rgba(28, 215, 96, 0.6), rgba(16, 44, 35, 0));
}

.login-card {
  position: relative;
  z-index: 1;
  padding: 2.5rem;
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}

.login-card__header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.login-card__avatar {
  box-shadow: 0 18px 35px rgba(29, 185, 84, 0.45);
}

.login-card__status {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 20px;
  background: rgba(22, 28, 41, 0.8);
  margin-bottom: 2rem;
}

.login-card__status-avatar {
  box-shadow: 0 18px 36px rgba(29, 185, 84, 0.35);
}

.login-card__actions {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-card__button {
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 600px) {
  .login-card {
    padding: 2rem;
  }
}
</style>
