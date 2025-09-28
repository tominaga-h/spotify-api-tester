<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import AlertCard from '@/components/AlertCard.vue';

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

const isAuthenticating = computed(() => status.value === 'authenticating');
const isError = computed(() => status.value === 'error');
</script>

<template>
  <div class="callback-page">
    <div class="callback-background">
      <div class="callback-background__gradient callback-background__gradient--top" />
      <div class="callback-background__gradient callback-background__gradient--bottom" />
    </div>
    <VContainer class="fill-height" max-width="960">
      <VRow class="fill-height" align="center" justify="center">
        <VCol cols="12" md="7" lg="6">
          <VCard class="callback-card" elevation="14" rounded="xl">
            <div class="callback-card__header">
              <VAvatar size="62" class="callback-card__avatar" color="primary" variant="tonal">
                <VIcon icon="mdi-shield-sync" size="36" />
              </VAvatar>
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Completing Spotify Authentication</div>
                <div class="text-h4 font-weight-bold">Spotify 認証を完了しています</div>
              </div>
            </div>

            <AlertCard
              v-if="isError"
              type="error"
              message="認証の完了に失敗しました。もう一度サインインするか、Spotify 設定をご確認ください。"
              :details="error.value?.message"
            />

            <div v-else class="callback-card__status">
              <VAvatar size="72" class="callback-card__status-avatar" color="primary" variant="tonal">
                <VProgressCircular
                  v-if="isAuthenticating"
                  indeterminate
                  color="primary"
                  size="42"
                  width="4"
                />
                <VIcon v-else icon="mdi-check-decagram" size="40" />
              </VAvatar>
              <div>
                <div class="text-h5 mb-1">Spotify ログインを最終確認しています…</div>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  この処理には数秒かかる場合があります。完了後、自動的にダッシュボードへ戻ります。
                </p>
              </div>
            </div>

            <VTimeline density="comfortable" class="callback-timeline" align="start">
              <VTimelineItem dot-color="success" size="small" icon="mdi-check">
                <div class="text-subtitle-2 font-weight-medium">リダイレクト完了</div>
                <div class="text-caption text-medium-emphasis">Spotify からの authorization code を取得しました。</div>
              </VTimelineItem>
              <VTimelineItem
                :dot-color="isAuthenticating ? 'primary' : 'surface'"
                size="small"
                :icon="isAuthenticating ? 'mdi-progress-clock' : 'mdi-check'"
              >
                <div class="text-subtitle-2 font-weight-medium">アクセストークン取得中</div>
                <div class="text-caption text-medium-emphasis">
                  {{ isAuthenticating ? '安全なアクセストークンを生成しています…' : 'トークンを取得しました。' }}
                </div>
              </VTimelineItem>
              <VTimelineItem dot-color="surface" size="small" icon="mdi-home-import-outline">
                <div class="text-subtitle-2 font-weight-medium">ホームへ遷移</div>
                <div class="text-caption text-medium-emphasis">処理完了後、自動的にトップページへ戻ります。</div>
              </VTimelineItem>
            </VTimeline>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style lang="scss">
.callback-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.callback-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;

  &__gradient {
    position: absolute;
    width: 420px;
    height: 420px;
    filter: blur(90px);
    opacity: 0.75;

    &--top {
      top: -100px;
      right: -60px;
      background: radial-gradient(circle, rgba(29, 185, 84, 0.8), rgba(12, 26, 20, 0));
    }

    &--bottom {
      bottom: -120px;
      left: -80px;
      background: radial-gradient(circle, rgba(25, 215, 96, 0.55), rgba(12, 34, 24, 0));
    }
  }
}

.callback-card {
  position: relative;
  z-index: 1;
  padding: 2.5rem;
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);

  &__header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  &__avatar {
    box-shadow: 0 20px 38px rgba(29, 185, 84, 0.45);
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    border-radius: 20px;
    background: rgba(22, 28, 41, 0.8);
    margin-bottom: 2.2rem;

    &-avatar {
      box-shadow: 0 18px 36px rgba(29, 185, 84, 0.35);
    }
  }
}

.callback-timeline {
  background: rgba(13, 20, 30, 0.9);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

@media (max-width: 600px) {
  .callback-card {
    padding: 2rem;
  }
}
</style>
