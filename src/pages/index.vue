<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import { useParticleAnimations, useAnimationDelays, useHoverEffects } from '@/composables/useAnimations';

interface SpotifyProfile {
  display_name: string;
  email: string;
  id: string;
  images?: { url: string }[];
}

const router = useRouter();
const { config, status, error, client, logOut } = useSpotifyAuth();

// アニメーション関連のcomposables
const { backgroundParticles, visualParticles, getParticleStyle, getVisualParticleStyle } = useParticleAnimations();
const { getCardDelay, getListItemDelay, getChipDelay } = useAnimationDelays();
const { isHovered, setHovered } = useHoverEffects();

const profile = ref<SpotifyProfile | null>(null);
const loadingProfile = ref(false);

watch(
  () => client?.value,
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

const isAuthenticated = computed(() => status?.value === 'authenticated');

const statusMeta = computed(() => {
  switch (status?.value) {
    case 'authenticated':
      return {
        label: 'Authenticated',
        chip: 'success',
        icon: 'mdi-check-circle',
        description:
          'Spotify Web API に接続されています。音楽データの取得や再生コントロールが利用できます。',
      } as const;
    case 'authenticating':
      return {
        label: 'Spotifyへリダイレクト中…',
        chip: 'info',
        icon: 'mdi-timer-sand',
        description:
          'Spotify 認証フローにリダイレクトしています。ブラウザのポップアップをご確認ください。',
      } as const;
    case 'error':
      return {
        label: '認証に失敗しました',
        chip: 'error',
        icon: 'mdi-alert-circle',
        description:
          '認証が完了しませんでした。クライアント設定をご確認のうえ再試行してください。',
      } as const;
    default:
      return {
        label: '未認証です',
        chip: 'warning',
        icon: 'mdi-lock-alert',
        description: 'まだ Spotify にサインインしていません。下のボタンからログインしてください。',
      } as const;
  }
});

const statusLabel = computed(() => statusMeta.value?.label ?? '未認証です');

const availableScopes = computed(() => config?.value?.scopes ?? []);

const environmentCards = computed(() => [
  {
    title: 'Client ID',
    value: config?.value?.clientId ?? '未設定',
    icon: 'mdi-application-brackets-outline',
  },
  {
    title: 'Redirect URI',
    value: config?.value?.redirectUri ?? '未設定',
    icon: 'mdi-rotate-360',
  },
  {
    title: 'Scopes',
    value: availableScopes.value?.join(', ') || 'デフォルト権限',
    icon: 'mdi-security',
  },
]);

const profileHighlights = computed(() => {
  if (!profile.value) {
    return [] as Array<{ label: string; value: string; icon: string }>;
  }

  return [
    {
      label: '表示名',
      value: profile.value?.display_name ?? '',
      icon: 'mdi-account-music',
    },
    {
      label: 'メール',
      value: profile.value?.email ?? '',
      icon: 'mdi-email-outline',
    },
    {
      label: 'ユーザー ID',
      value: profile.value?.id ?? '',
      icon: 'mdi-identifier',
    },
  ];
});

const profileImage = computed(() => profile.value?.images?.[0]?.url ?? null);

const handleNavigateToLogin = async () => {
  if (status?.value === 'authenticated') {
    logOut();
    await router.push({ path: '/login', query: { reauthenticate: '1' } });
    return;
  }

  await router.push('/login');
};

const navigateToTrack = () => {
  router.push('/track');
};

const quickActions = computed(() => [
  {
    key: 'now-playing',
    label: 'Now Playing を開く',
    description: '現在再生中のトラックとプレイリストの詳細を確認',
    icon: 'mdi-music-circle',
    color: 'primary',
    variant: 'elevated' as const,
    handler: navigateToTrack,
  },
  {
    key: 'auth',
    label: isAuthenticated.value ? 'Spotify を再認証' : 'Spotify にサインイン',
    description: isAuthenticated.value
      ? 'アクセストークンをリセットして新しくログイン'
      : 'Spotify OAuth フローを開始して接続',
    icon: isAuthenticated.value ? 'mdi-refresh' : 'mdi-login',
    color: isAuthenticated.value ? 'secondary' : 'success',
    variant: 'tonal' as const,
    handler: handleNavigateToLogin,
  },
]);

</script>

<template>
  <VContainer class="home-page py-12" max-width="1200">
    <!-- Floating Particles Background -->
    <div class="particles-container">
      <div v-for="i in backgroundParticles" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <VRow>
      <VCol cols="12">
        <VSheet class="hero-card pa-8" elevation="12" rounded="xl">
          <!-- Animated Background Elements -->
          <div class="hero-card__bg-elements">
            <div class="hero-card__wave hero-card__wave--1"></div>
            <div class="hero-card__wave hero-card__wave--2"></div>
            <div class="hero-card__wave hero-card__wave--3"></div>
          </div>

          <VRow class="align-center">
            <VCol cols="12" md="7">
              <div class="hero-card__badge">
                <VIcon :icon="statusMeta?.icon" size="18" class="mr-2" />
                <span>{{ statusLabel }}</span>
                <div class="hero-card__badge-glow"></div>
              </div>

              <h1 class="text-h3 font-weight-bold line-height-1 mb-4 hero-title">
                <span class="hero-title__main">Spotify の世界を</span>
                <span class="hero-title__highlight">ダッシュボード感覚で操作</span>
              </h1>

              <p class="text-body-1 mb-6 text-medium-emphasis hero-description">
                OAuth で認証すると、今聞いているトラックやプレイリスト情報をリアルタイムに取得できます。
                <br>
                <span class="text-gradient">Spotify Web API TS SDK</span> と <span class="text-gradient">Nuxt 3</span> の組み合わせで、リッチな音楽エクスペリエンスを構築しましょう。
              </p>

              <div class="d-flex flex-wrap gap-4 hero-card__actions">
              <VBtn
                color="primary"
                size="large"
                  elevation="6"
                  class="hero-btn hero-btn--primary"
                  @click="navigateToTrack"
                >
                  <VIcon start icon="mdi-music-circle" />
                  Now Playing を開く
                  <div class="hero-btn__ripple"></div>
                </VBtn>
                <VBtn
                  :color="isAuthenticated ? 'secondary' : 'success'"
                  variant="tonal"
                  size="large"
                  class="hero-btn hero-btn--auth"
                @click="handleNavigateToLogin"
              >
                  <VIcon
                    start
                    :icon="isAuthenticated ? 'mdi-refresh' : 'mdi-login'"
                  />
                  {{ isAuthenticated ? '再認証する' : 'Spotify でログイン' }}
                  <div class="hero-btn__ripple"></div>
              </VBtn>
            </div>

              <div v-if="availableScopes.length" class="hero-card__scopes mt-6">
                <span class="text-caption text-uppercase text-medium-emphasis mr-3">Scopes</span>
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    v-for="(scope, index) in availableScopes"
                    :key="scope"
                    label
                    size="small"
                    color="primary"
                    variant="outlined"
                    class="hero-card__chip"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    {{ scope }}
                  </VChip>
                </div>
              </div>
            </VCol>

            <VCol cols="12" md="5" class="hero-visual__wrapper">
              <VHover v-slot="{ isHovering, props }">
                <div class="hero-visual" v-bind="props">
                  <div class="hero-visual__glow" />
                  <div class="hero-visual__ring" :class="{ 'hero-visual__ring--pulse': isHovering }" />
                  <div class="hero-visual__particles">
                    <div v-for="i in visualParticles" :key="i" class="hero-visual__particle" :style="getVisualParticleStyle(i)"></div>
                  </div>
                  <VAvatar size="200" class="hero-visual__avatar">
                    <template v-if="profileImage">
                      <VImg :src="profileImage" alt="Spotify avatar" cover />
                    </template>
                    <template v-else>
                      <div class="hero-visual__placeholder">
                        <VIcon icon="mdi-spotify" size="96" />
                      </div>
                    </template>
                  </VAvatar>
                  <VFadeTransition>
                    <VChip
                      v-if="isAuthenticated"
                      key="auth-chip"
                      color="success"
                      variant="flat"
                      prepend-icon="mdi-check"
                      class="hero-visual__chip"
                    >
                      Connected
                    </VChip>
                  </VFadeTransition>
                </div>
              </VHover>
            </VCol>
          </VRow>
        </VSheet>
      </VCol>
    </VRow>

    <VRow class="mt-8" align="stretch">
      <VCol
        v-for="(card, index) in environmentCards"
        :key="card.title"
        cols="12"
        md="4"
      >
        <VCard
          class="info-card"
          variant="tonal"
          color="primary"
          elevation="10"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <div class="info-card__bg-pattern"></div>
          <div class="info-card__icon">
            <VIcon :icon="card.icon" size="26" />
            <div class="info-card__icon-glow"></div>
          </div>
          <div class="info-card__content">
            <div class="text-caption text-uppercase text-medium-emphasis info-card__label">{{ card.title }}</div>
            <div class="text-h6 font-weight-medium mt-1 info-card__value">{{ card.value }}</div>
            <div class="info-card__accent-line"></div>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-10" align="stretch">
      <VCol cols="12" md="6">
        <VCard class="profile-card" elevation="10" rounded="xl">
          <div class="profile-card__bg-gradient"></div>
          <div class="profile-card__header">
            <div>
              <div class="text-subtitle-1 text-medium-emphasis profile-card__section-label">Profile</div>
              <div class="text-h5 font-weight-bold profile-card__title">Spotify アカウント情報</div>
            </div>
            <VChip :color="statusMeta?.chip" variant="tonal" :prepend-icon="statusMeta?.icon" class="profile-card__status-chip">
              {{ statusLabel }}
            </VChip>
          </div>

          <div class="profile-card__body">
            <div v-if="loadingProfile" class="profile-card__loading">
              <VProgressCircular indeterminate color="primary" class="mr-4" />
              <span>プロフィールを読み込み中です…</span>
            </div>

            <template v-else>
              <div v-if="profile" class="profile-card__details">
                <div class="profile-card__avatar-container">
                  <VAvatar size="96" class="profile-card__avatar">
                    <template v-if="profileImage">
                      <VImg :src="profileImage" alt="Spotify avatar" />
                    </template>
                    <template v-else>
                      <VIcon icon="mdi-account-music" size="56" />
                    </template>
                  </VAvatar>
                  <div class="profile-card__avatar-ring"></div>
                </div>

                <div class="profile-card__meta">
                  <div class="text-h6 mb-1 profile-card__name">{{ profile.display_name }}</div>
                  <div class="text-body-2 text-medium-emphasis mb-4 profile-card__email">{{ profile.email }}</div>
                  <VList density="compact" lines="one" class="profile-card__list">
                    <VListItem
                      v-for="(item, index) in profileHighlights"
                      :key="item.label"
                      class="profile-card__list-item"
                      :style="{ animationDelay: `${index * 0.1}s` }"
                    >
                      <template #prepend>
                        <VAvatar color="primary" variant="tonal" size="36" class="profile-card__list-icon">
                          <VIcon :icon="item.icon" size="20" />
                        </VAvatar>
                      </template>
                      <VListItemTitle class="text-caption text-uppercase text-medium-emphasis">
                        {{ item.label }}
                      </VListItemTitle>
                      <VListItemSubtitle class="text-body-2">{{ item.value }}</VListItemSubtitle>
                    </VListItem>
                  </VList>
                </div>
              </div>

              <div v-else class="profile-card__empty text-medium-emphasis">
                <VIcon icon="mdi-account-music-outline" size="48" class="mb-3" />
                <div>まだプロフィールが読み込まれていません。</div>
                <div>Spotify にサインインするとプロフィール情報が表示されます。</div>
              </div>
            </template>
          </div>

          <VAlert
             v-if="error?.value"
            type="error"
            variant="tonal"
            border="start"
             class="mt-4 profile-card__error"
          >
             {{ error?.value?.message }}
          </VAlert>
        </VCard>
      </VCol>

      <VCol cols="12" md="6">
        <VCard class="actions-card" elevation="10" rounded="xl">
          <div class="actions-card__bg-pattern"></div>
          <div class="actions-card__header">
            <div class="text-subtitle-1 text-medium-emphasis actions-card__section-label">Quick Actions</div>
            <div class="text-h5 font-weight-bold actions-card__title">よく使う操作</div>
          </div>
          <VRow>
            <VCol
              v-for="(action, index) in quickActions"
              :key="action.key"
              cols="12"
            >
              <VCard
                :color="action.color"
                :variant="action.variant"
                class="quick-action"
                :style="{ animationDelay: `${index * 0.15}s` }"
                @click="action.handler()"
              >
                <div class="quick-action__bg-effect"></div>
                <div class="quick-action__icon">
                  <VIcon :icon="action.icon" size="28" />
                  <div class="quick-action__icon-glow"></div>
              </div>
                <div class="quick-action__content">
                  <div class="text-subtitle-1 font-weight-medium quick-action__title">{{ action.label }}</div>
                  <div class="text-body-2 text-medium-emphasis quick-action__description">{{ action.description }}</div>
            </div>
                <VIcon icon="mdi-arrow-right" size="20" class="ml-auto quick-action__arrow" />
                <div class="quick-action__hover-effect"></div>
              </VCard>
      </VCol>
    </VRow>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style lang="scss">
@import '@/assets/styles/animations.scss';

.home-page {
  position: relative;
  z-index: 2;
  overflow: hidden;
}

// Hero Card Enhanced
.hero-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(99, 102, 241, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  animation: slideInUp 0.8s ease-out;
}

.hero-card__bg-elements {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-card__wave {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  animation: wave 8s ease-in-out infinite;
}

.hero-card__wave--1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.hero-card__wave--2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 2s;
}

.hero-card__wave--3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}


.hero-card__badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  animation: fadeInDown 0.6s ease-out 0.2s both;
}

.hero-card__badge-glow {
  position: absolute;
  inset: -2px;
  border-radius: 999px;
  background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
  filter: blur(8px);
  opacity: 0;
  animation: pulse 2s ease-in-out infinite;
}

.hero-title {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.hero-title__main {
  display: block;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-title__highlight {
  display: block;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.hero-title__highlight::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  border-radius: 2px;
  animation: expandWidth 1s ease-out 1.2s both;
}


.hero-description {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.text-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.hero-card__actions {
  gap: 1rem;
  animation: fadeInUp 0.8s ease-out 0.8s both;
}

.hero-btn {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn__ripple {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  transform: scale(0);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn:hover .hero-btn__ripple {
  transform: scale(1);
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
}

.hero-card__scopes {
  background: rgba(14, 18, 26, 0.6);
  border-radius: 18px;
  padding: 0.9rem 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  animation: fadeInUp 0.8s ease-out 1s both;
}

.hero-card__chip {
  border-radius: 999px;
  animation: slideInLeft 0.6s ease-out both;
}

// Hero Visual Enhanced
.hero-visual__wrapper {
  display: flex;
  justify-content: center;
  animation: fadeInRight 0.8s ease-out 0.4s both;
}

.hero-visual {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-visual__glow {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0.05) 70%);
  filter: blur(20px);
  animation: pulse 3s ease-in-out infinite;
}

.hero-visual__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.18);
  animation: rotate 18s linear infinite;
}

.hero-visual__ring--pulse {
  animation-duration: 12s;
  border-color: rgba(99, 102, 241, 0.4);
}

.hero-visual__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-visual__particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, transparent 100%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  animation: orbit var(--particle-duration) linear infinite;
  animation-delay: var(--particle-delay);
}

.hero-visual__particle::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: inherit;
  animation: twinkle 2s ease-in-out infinite alternate;
}


.hero-visual__avatar {
  border: 4px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  transition: all 0.3s ease;
}

.hero-visual__avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 25px 50px rgba(99, 102, 241, 0.3);
}

.hero-visual__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(46, 64, 89, 0.6));
  border-radius: 50%;
}

.hero-visual__chip {
  position: absolute;
  bottom: -12px;
  right: -12px;
  box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4);
  animation: bounce 2s ease-in-out infinite;
}


// Info Cards Enhanced
.info-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: rgba(18, 22, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideInUp 0.6s ease-out both;
  overflow: hidden;
}

.info-card__bg-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30px, -30px);
}

.info-card__icon {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(99, 102, 241, 0.12);
  display: grid;
  place-items: center;
  color: #6366f1;
  z-index: 2;
}

.info-card__icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
  filter: blur(8px);
  opacity: 0;
  animation: pulse 3s ease-in-out infinite;
}

.info-card__content {
  flex: 1;
  z-index: 2;
}

.info-card__label {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.info-card__value {
  font-family: 'Fira Mono', monospace;
  word-break: break-all;
}

.info-card__accent-line {
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 1px;
  margin-top: 0.5rem;
  animation: expandWidth 1s ease-out 0.5s both;
}

// Profile Card Enhanced
.profile-card {
  position: relative;
  background: rgba(13, 18, 27, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.04);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  animation: slideInLeft 0.8s ease-out both;
  overflow: hidden;
}

.profile-card__bg-gradient {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(50px, -50px);
}

.profile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.profile-card__section-label {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.profile-card__title {
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.profile-card__status-chip {
  animation: slideInRight 0.6s ease-out 0.3s both;
}

.profile-card__body {
  flex: 1;
  position: relative;
  z-index: 2;
}

.profile-card__loading {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  animation: pulse 2s ease-in-out infinite;
}

.profile-card__details {
  display: flex;
  gap: 1.5rem;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.profile-card__avatar-container {
  position: relative;
}

.profile-card__avatar {
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.45);
  background: rgba(99, 102, 241, 0.1);
  border: 3px solid rgba(99, 102, 241, 0.2);
  transition: all 0.3s ease;
}

.profile-card__avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 25px 45px rgba(99, 102, 241, 0.3);
}

.profile-card__avatar-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.3);
  animation: rotate 10s linear infinite;
}

.profile-card__meta {
  flex: 1;
}

.profile-card__name {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.profile-card__email {
  font-family: 'Fira Mono', monospace;
}

.profile-card__list {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 0.5rem;
}

.profile-card__list-item {
  border-radius: 16px;
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
  animation: slideInLeft 0.6s ease-out both;
}

.profile-card__list-item:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: translateX(4px);
}

.profile-card__list-icon {
  transition: all 0.3s ease;
}

.profile-card__list-item:hover .profile-card__list-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.profile-card__empty {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  text-align: center;
  animation: fadeIn 0.6s ease-out 0.4s both;
}

// Actions Card Enhanced
.actions-card {
  position: relative;
  background: rgba(15, 22, 31, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 2rem;
  animation: slideInRight 0.8s ease-out both;
  overflow: hidden;
}

.actions-card__bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50px, -50px);
}

.actions-card__section-label {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.actions-card__title {
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions-card__header {
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
}

.quick-action {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  border-radius: 20px;
  padding: 1.2rem 1.4rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideInUp 0.6s ease-out both;
}

.quick-action__bg-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-action:hover .quick-action__bg-effect {
  opacity: 1;
}

.quick-action:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
}

.quick-action__icon {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  transition: all 0.3s ease;
  z-index: 2;
}

.quick-action__icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 18px;
  background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
  filter: blur(8px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-action:hover .quick-action__icon-glow {
  opacity: 1;
}

.quick-action:hover .quick-action__icon {
  transform: scale(1.1);
  background: rgba(99, 102, 241, 0.2);
}

.quick-action__content {
  flex: 1;
  z-index: 2;
}

.quick-action__title {
  transition: all 0.3s ease;
}

.quick-action:hover .quick-action__title {
  color: #6366f1;
}

.quick-action__arrow {
  transition: all 0.3s ease;
  z-index: 2;
}

.quick-action:hover .quick-action__arrow {
  transform: translateX(4px);
  color: #6366f1;
}

.quick-action__hover-effect {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-action:hover .quick-action__hover-effect {
  opacity: 1;
}

// Responsive Design
@media (max-width: 960px) {
  .hero-card {
    padding: 2.5rem;
  }

  .hero-card__actions {
    width: 100%;
  }

  .hero-card__actions .v-btn {
    flex: 1;
  }

  .hero-visual {
    margin-top: 1.5rem;
  }

  .profile-card__details {
    flex-direction: column;
    text-align: center;
  }

  .profile-card__avatar-container {
    align-self: center;
  }
}
</style>
