<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import QRCode from 'qrcode';

interface Props {
  trackId?: string | null;
  playlistId?: string | null;
  loading?: boolean;
  heroMode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  trackId: null,
  playlistId: null,
  loading: false,
  heroMode: false,
  size: 'medium'
});

const qrCodeDataUrl = ref<string | null>(null);
const qrLoading = ref(false);
const qrError = ref<string | null>(null);

const spotifyUrl = computed(() => {
  if (props.trackId) {
    return `https://open.spotify.com/track/${props.trackId}`;
  }
  if (props.playlistId) {
    return `https://open.spotify.com/playlist/${props.playlistId}`;
  }
  return null;
});

const qrTitle = computed(() => {
  if (props.trackId) return 'Spotify 楽曲 QRコード';
  if (props.playlistId) return 'Spotify プレイリスト QRコード';
  return 'Spotify QRコード';
});

const qrDescription = computed(() => {
  if (props.trackId) return 'QRコードをスキャンしてSpotifyで楽曲を開く';
  if (props.playlistId) return 'QRコードをスキャンしてSpotifyでプレイリストを開く';
  return 'QRコードをスキャンしてSpotifyで開く';
});

const qrSize = computed(() => {
  if (props.heroMode) return 120;
  switch (props.size) {
    case 'small': return 150;
    case 'medium': return 200;
    case 'large': return 300;
    default: return 200;
  }
});

const generateQRCode = async () => {
  if (!spotifyUrl.value) {
    qrCodeDataUrl.value = null;
    return;
  }

  qrLoading.value = true;
  qrError.value = null;

  try {
    const dataUrl = await QRCode.toDataURL(spotifyUrl.value, {
      width: qrSize.value,
      margin: 2,
      color: {
        dark: '#1DB954',
        light: '#FFFFFF'
      }
    });
    qrCodeDataUrl.value = dataUrl;
  } catch (error) {
    qrError.value = 'QRコードの生成に失敗しました';
    console.error('QR Code generation failed:', error);
  } finally {
    qrLoading.value = false;
  }
};

watch(spotifyUrl, generateQRCode, { immediate: true });
</script>

<template>
  <div v-if="heroMode" class="qr-code-hero">
    <div v-if="loading || props.loading" class="qr-code-hero__loading">
      <VProgressCircular indeterminate color="primary" size="20" />
    </div>
    <div v-else-if="qrLoading" class="qr-code-hero__loading">
      <VProgressCircular indeterminate color="primary" size="20" />
    </div>
    <div v-else-if="qrCodeDataUrl" class="qr-code-hero__qr">
      <VTooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <div v-bind="tooltipProps" class="qr-code-hero__qr-image">
            <img :src="qrCodeDataUrl" alt="Spotify QR Code" />
          </div>
        </template>
        <span>{{ qrDescription }}</span>
      </VTooltip>
    </div>
  </div>

  <VCard v-else class="qr-code-card">
    <VCardTitle class="qr-code-card__header">
      <VIcon icon="mdi-qrcode" class="me-2" />
      {{ qrTitle }}
    </VCardTitle>

    <VCardText class="qr-code-card__content">
      <div v-if="loading || props.loading" class="qr-code-card__loading">
        <VProgressCircular indeterminate color="primary" />
        <span class="ms-3">楽曲情報を取得中...</span>
      </div>

      <div v-else-if="qrLoading" class="qr-code-card__loading">
        <VProgressCircular indeterminate color="primary" />
        <span class="ms-3">QRコードを生成中...</span>
      </div>

      <div v-else-if="qrError" class="qr-code-card__error">
        <VAlert type="error" variant="tonal">
          {{ qrError }}
        </VAlert>
      </div>

      <div v-else-if="!trackId && !playlistId" class="qr-code-card__empty">
        <VIcon icon="mdi-music-box-outline" size="48" class="mb-3" />
        <p class="text-body-2 text-medium-emphasis">
          {{ trackId ? '現在再生中のトラックがありません' : 'プレイリスト情報がありません' }}
        </p>
      </div>

      <div v-else-if="qrCodeDataUrl" class="qr-code-card__qr">
        <div class="qr-code-card__qr-image">
          <img :src="qrCodeDataUrl" alt="Spotify QR Code" />
        </div>
        <div class="qr-code-card__qr-info">
          <p class="text-body-2 text-medium-emphasis mb-2">
            {{ qrDescription }}
          </p>
          <VBtn
            :href="spotifyUrl"
            target="_blank"
            variant="outlined"
            color="primary"
            size="small"
            prepend-icon="mdi-open-in-new"
          >
            Spotifyで開く
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.qr-code-hero {
  display: flex;
  align-items: center;
  justify-content: center;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
  }

  &__qr {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__qr-image {
    padding: 8px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(29, 185, 84, 0.3);

    img {
      display: block;
      width: 80px;
      height: 80px;
    }
  }
}

.qr-code-card {
  background: rgba(14, 19, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.7);
  }

  &__error {
    width: 100%;
    padding: 1rem;
  }

  &__qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem;
  }

  &__qr-image {
    padding: 1rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    img {
      display: block;
      width: 100%;
      height: auto;
      max-width: 300px;
    }
  }

  &__qr-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
  }
}

@media (max-width: 600px) {
  .qr-code-card {
    &__qr-image img {
      width: 160px;
      height: 160px;
    }
  }
}
</style>