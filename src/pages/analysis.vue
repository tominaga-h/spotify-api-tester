<script setup lang="ts">
import { computed } from 'vue'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import { useSpotifyAnalysis } from '@/composables/useSpotifyAnalysis'
import ActionButton from '@/components/ActionButton.vue'

const router = useRouter()
const { status } = useSpotifyAuth()
const { loading, progress, error, result, canAnalyze, runAnalysis, exportJson } = useSpotifyAnalysis()

const isAuthenticated = computed(() => status?.value === 'authenticated')

const timeRangeLabels: Record<string, string> = {
  shortTerm: '直近4週間',
  mediumTerm: '直近6ヶ月',
  longTerm: '全期間',
}

const topGenres = computed(() => result.value?.genres.slice(0, 15) ?? [])
</script>

<template>
  <div class="analysis-page">
    <div class="analysis-header">
      <button class="back-btn" @click="router.push('/')">
        <VIcon icon="mdi-arrow-left" size="18" />
        <span>Home</span>
      </button>

      <h1 class="analysis-title">
        <span class="analysis-title__primary">Music</span>
        <span class="analysis-title__secondary">Analysis</span>
      </h1>

      <p class="analysis-description">
        あなたのリスニング傾向を分析します
      </p>
    </div>

    <!-- Not authenticated -->
    <div v-if="!isAuthenticated" class="analysis-empty">
      <VIcon icon="mdi-lock-outline" size="48" color="var(--base-500)" />
      <p>分析するにはログインしてください</p>
      <ActionButton variant="primary" @click="router.push('/login')">
        Sign In
      </ActionButton>
    </div>

    <!-- Controls -->
    <div v-else class="analysis-controls">
      <ActionButton
        variant="primary"
        :disabled="!canAnalyze"
        icon="mdi-chart-bar"
        @click="runAnalysis"
      >
        {{ loading ? progress : '分析を開始' }}
      </ActionButton>

      <ActionButton
        v-if="result"
        variant="outline"
        icon="mdi-download"
        @click="exportJson"
      >
        JSONエクスポート
      </ActionButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="analysis-loading">
      <VProgressLinear indeterminate color="cyan" class="mb-4" />
      <p class="analysis-loading__text">{{ progress }}</p>
    </div>

    <!-- Error -->
    <VAlert v-if="error" type="error" variant="tonal" class="analysis-error">
      {{ error }}
    </VAlert>

    <!-- Results -->
    <div v-if="result" class="analysis-results">

      <!-- Top Artists -->
      <section class="section">
        <h2 class="section__title">
          <VIcon icon="mdi-account-music" size="24" />
          トップアーティスト
        </h2>
        <div class="time-range-tabs">
          <VTabs v-model="artistTab" bg-color="transparent" color="cyan">
            <VTab v-for="(label, key) in timeRangeLabels" :key="key" :value="key">
              {{ label }}
            </VTab>
          </VTabs>
          <VWindow v-model="artistTab">
            <VWindowItem v-for="(label, key) in timeRangeLabels" :key="key" :value="key">
              <div class="artist-grid">
                <div
                  v-for="(artist, i) in result.topArtists[key as keyof typeof result.topArtists]?.slice(0, 20)"
                  :key="artist.name"
                  class="artist-card"
                >
                  <span class="artist-card__rank">#{{ i + 1 }}</span>
                  <img
                    v-if="artist.imageUrl"
                    :src="artist.imageUrl"
                    :alt="artist.name"
                    class="artist-card__image"
                  />
                  <div v-else class="artist-card__placeholder">
                    <VIcon icon="mdi-account-music" size="24" />
                  </div>
                  <div class="artist-card__info">
                    <span class="artist-card__name">{{ artist.name }}</span>
                    <span class="artist-card__genres">{{ artist.genres.slice(0, 2).join(', ') }}</span>
                  </div>
                </div>
              </div>
            </VWindowItem>
          </VWindow>
        </div>
      </section>

      <!-- Top Tracks -->
      <section class="section">
        <h2 class="section__title">
          <VIcon icon="mdi-music-note" size="24" />
          トップトラック
        </h2>
        <VTabs v-model="trackTab" bg-color="transparent" color="cyan">
          <VTab v-for="(label, key) in timeRangeLabels" :key="key" :value="key">
            {{ label }}
          </VTab>
        </VTabs>
        <VWindow v-model="trackTab">
          <VWindowItem v-for="(label, key) in timeRangeLabels" :key="key" :value="key">
            <div class="track-list">
              <div
                v-for="(track, i) in result.topTracks[key as keyof typeof result.topTracks]?.slice(0, 20)"
                :key="`${track.name}-${i}`"
                class="track-item"
              >
                <span class="track-item__rank">#{{ i + 1 }}</span>
                <div class="track-item__info">
                  <span class="track-item__name">{{ track.name }}</span>
                  <span class="track-item__meta">{{ track.artists.join(', ') }} / {{ track.album }}</span>
                </div>
                <span class="track-item__popularity">{{ track.popularity }}</span>
              </div>
            </div>
          </VWindowItem>
        </VWindow>
      </section>

      <!-- Genre Distribution -->
      <section class="section">
        <h2 class="section__title">
          <VIcon icon="mdi-tag-multiple" size="24" />
          ジャンル分布
        </h2>
        <div class="genre-bars">
          <div v-for="genre in topGenres" :key="genre.genre" class="genre-bar">
            <div class="genre-bar__label">{{ genre.genre }}</div>
            <div class="genre-bar__track">
              <div
                class="genre-bar__fill"
                :style="{ width: `${genre.percentage}%` }"
              />
            </div>
            <div class="genre-bar__value">{{ genre.percentage }}%</div>
          </div>
        </div>
      </section>

      <!-- Playlists -->
      <section class="section">
        <h2 class="section__title">
          <VIcon icon="mdi-playlist-music" size="24" />
          プレイリスト分析
        </h2>
        <div class="playlist-grid">
          <div v-for="pl in result.playlists" :key="pl.id" class="playlist-card">
            <div class="playlist-card__header">
              <h3 class="playlist-card__name">{{ pl.name }}</h3>
              <span class="playlist-card__count">{{ pl.trackCount }} tracks</span>
            </div>
            <div class="playlist-card__artists">
              <span class="playlist-card__label">Top Artists</span>
              <div class="playlist-card__artist-list">
                <span v-for="a in pl.topArtists" :key="a.name" class="playlist-card__artist">
                  {{ a.name }} ({{ a.count }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      artistTab: 'shortTerm',
      trackTab: 'shortTerm',
    }
  },
}
</script>

<style lang="scss">
.analysis-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-8);
  min-height: 100vh;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  color: var(--base-600);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-2) 0;
  transition: color var(--duration-normal) var(--ease-out);
  margin-bottom: var(--space-8);

  &:hover {
    color: var(--neon-electric);
  }
}

.analysis-header {
  margin-bottom: var(--space-10);
}

.analysis-title {
  font-size: var(--text-4xl);
  line-height: 0.9;
  margin-bottom: var(--space-4);

  &__primary {
    display: block;
    font-variation-settings: 'wght' 800;
    background: var(--gradient-neon-1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__secondary {
    display: block;
    font-variation-settings: 'wght' 200;
    color: var(--base-600);
  }
}

.analysis-description {
  color: var(--base-600);
  font-size: var(--text-base);
}

.analysis-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  color: var(--base-500);
}

.analysis-controls {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.analysis-loading {
  padding: var(--space-8) 0;

  &__text {
    color: var(--base-600);
    font-size: var(--text-sm);
    text-align: center;
  }
}

.analysis-error {
  margin-bottom: var(--space-8);
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

// Section
.section {
  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xl);
    font-variation-settings: 'wght' 700;
    color: var(--base-900);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid var(--base-200);
  }
}

// Artist Grid
.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.artist-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--base-100);
  border: var(--border-muted);
  transition: all var(--duration-normal) var(--ease-out);

  &:hover {
    border-color: var(--neon-electric);
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.15);
  }

  &__rank {
    font-size: var(--text-xs);
    font-variation-settings: 'wght' 700;
    color: var(--neon-electric);
    min-width: 28px;
  }

  &__image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: var(--radius-sharp);
  }

  &__placeholder {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--base-200);
    color: var(--base-500);
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: var(--text-sm);
    font-variation-settings: 'wght' 600;
    color: var(--base-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__genres {
    font-size: var(--text-xs);
    color: var(--base-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// Track List
.track-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) 0;
}

.track-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  transition: background var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--base-100);
  }

  &__rank {
    font-size: var(--text-xs);
    font-variation-settings: 'wght' 700;
    color: var(--neon-pink);
    min-width: 28px;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: var(--text-sm);
    font-variation-settings: 'wght' 600;
    color: var(--base-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: block;
    font-size: var(--text-xs);
    color: var(--base-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__popularity {
    font-size: var(--text-xs);
    font-variation-settings: 'wght' 600;
    color: var(--neon-green);
    min-width: 28px;
    text-align: right;
  }
}

// Genre Bars
.genre-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.genre-bar {
  display: grid;
  grid-template-columns: 160px 1fr 50px;
  align-items: center;
  gap: var(--space-3);

  &__label {
    font-size: var(--text-sm);
    color: var(--base-700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track {
    height: 8px;
    background: var(--base-200);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: var(--gradient-neon-1);
    transition: width 0.6s var(--ease-out);
    min-width: 2px;
  }

  &__value {
    font-size: var(--text-xs);
    font-variation-settings: 'wght' 600;
    color: var(--base-600);
    text-align: right;
  }
}

// Playlist Grid
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.playlist-card {
  padding: var(--space-5);
  background: var(--base-100);
  border: var(--border-muted);
  transition: all var(--duration-normal) var(--ease-out);

  &:hover {
    border-color: var(--neon-purple);
    box-shadow: 0 0 15px rgba(128, 0, 255, 0.15);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-3);
  }

  &__name {
    font-size: var(--text-base);
    font-variation-settings: 'wght' 700;
    color: var(--base-900);
    margin: 0;
  }

  &__count {
    font-size: var(--text-xs);
    color: var(--base-500);
  }

  &__artists {
    margin-bottom: var(--space-3);
  }

  &__label {
    display: block;
    font-size: var(--text-xs);
    color: var(--base-500);
    margin-bottom: var(--space-1);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__artist-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  &__artist {
    font-size: var(--text-xs);
    padding: var(--space-0-5) var(--space-2);
    background: var(--base-200);
    color: var(--base-700);
  }

}

@media (max-width: 768px) {
  .artist-grid {
    grid-template-columns: 1fr;
  }

  .genre-bar {
    grid-template-columns: 100px 1fr 40px;
  }

  .playlist-grid {
    grid-template-columns: 1fr;
  }
}
</style>
