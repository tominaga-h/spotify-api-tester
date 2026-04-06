import { ref, computed } from 'vue'
import type { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { useSpotifyAuth } from './useSpotifyAuth'

export interface ArtistSummary {
  name: string
  genres: string[]
  popularity: number
  imageUrl: string | null
}

export interface TrackSummary {
  name: string
  artists: string[]
  album: string
  popularity: number
}

export interface PlaylistSummary {
  id: string
  name: string
  trackCount: number
  owner: string
  isPublic: boolean
  topArtists: { name: string; count: number }[]
}

export interface GenreCount {
  genre: string
  count: number
  percentage: number
}

export interface AnalysisResult {
  fetchedAt: string
  topArtists: {
    shortTerm: ArtistSummary[]
    mediumTerm: ArtistSummary[]
    longTerm: ArtistSummary[]
  }
  topTracks: {
    shortTerm: TrackSummary[]
    mediumTerm: TrackSummary[]
    longTerm: TrackSummary[]
  }
  genres: GenreCount[]
  playlists: PlaylistSummary[]
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

async function fetchTopArtists(client: SpotifyApi, timeRange: TimeRange, limit = 50): Promise<ArtistSummary[]> {
  const res = await client.currentUser.topItems('artists', timeRange, limit)
  return res.items.map((a) => ({
    name: a.name,
    genres: a.genres ?? [],
    popularity: a.popularity,
    imageUrl: a.images?.[0]?.url ?? null,
  }))
}

async function fetchTopTracks(client: SpotifyApi, timeRange: TimeRange, limit = 50): Promise<TrackSummary[]> {
  const res = await client.currentUser.topItems('tracks', timeRange, limit)
  return res.items.map((t) => ({
    name: t.name,
    artists: t.artists.map((a) => a.name),
    album: t.album.name,
    popularity: t.popularity,
  }))
}

function computeGenres(artists: ArtistSummary[]): GenreCount[] {
  const counts = new Map<string, number>()
  for (const a of artists) {
    for (const g of (a.genres ?? [])) {
      counts.set(g, (counts.get(g) ?? 0) + 1)
    }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return [...counts.entries()]
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
}

async function fetchPlaylists(client: SpotifyApi, maxPlaylists = 20): Promise<PlaylistSummary[]> {
  const res = await client.currentUser.playlists.playlists(maxPlaylists)
  const summaries: PlaylistSummary[] = []

  for (const pl of res.items) {
    let topArtists: { name: string; count: number }[] = []

    try {
      const artistCounts = new Map<string, number>()
      const tracks = await client.playlists.getPlaylistItems(pl.id, undefined, undefined, 100)
      for (const item of tracks.items) {
        const track = item?.track
        if (!track || !('artists' in track)) continue
        for (const artist of track.artists) {
          artistCounts.set(artist.name, (artistCounts.get(artist.name) ?? 0) + 1)
        }
      }
      topArtists = [...artistCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    } catch {
      console.warn(`Playlist "${pl.name}" (${pl.id}) tracks fetch failed, skipping details`)
    }

    summaries.push({
      id: pl.id,
      name: pl.name,
      trackCount: pl.tracks?.total ?? 0,
      owner: pl.owner.display_name ?? pl.owner.id,
      isPublic: pl.public ?? false,
      topArtists,
    })
  }

  return summaries
}

export function useSpotifyAnalysis() {
  const { client } = useSpotifyAuth()
  const loading = ref(false)
  const progress = ref('')
  const error = ref<string | null>(null)
  const result = ref<AnalysisResult | null>(null)

  const canAnalyze = computed(() => !!client.value && !loading.value)

  async function runAnalysis() {
    const sdk = client.value
    if (!sdk) {
      error.value = '認証されていません'
      return
    }

    loading.value = true
    error.value = null
    result.value = null

    try {
      progress.value = 'トップアーティストを取得中...'
      const [artistsShort, artistsMedium, artistsLong] = await Promise.all([
        fetchTopArtists(sdk, 'short_term'),
        fetchTopArtists(sdk, 'medium_term'),
        fetchTopArtists(sdk, 'long_term'),
      ])

      progress.value = 'トップトラックを取得中...'
      const [tracksShort, tracksMedium, tracksLong] = await Promise.all([
        fetchTopTracks(sdk, 'short_term'),
        fetchTopTracks(sdk, 'medium_term'),
        fetchTopTracks(sdk, 'long_term'),
      ])

      progress.value = 'ジャンル分布を計算中...'
      const allArtistsMap = new Map<string, ArtistSummary>()
      for (const a of [...artistsShort, ...artistsMedium, ...artistsLong]) {
        if (!allArtistsMap.has(a.name)) allArtistsMap.set(a.name, a)
      }
      const genres = computeGenres([...allArtistsMap.values()])

      progress.value = 'プレイリストを分析中...'
      const playlists = await fetchPlaylists(sdk)

      result.value = {
        fetchedAt: new Date().toISOString(),
        topArtists: {
          shortTerm: artistsShort,
          mediumTerm: artistsMedium,
          longTerm: artistsLong,
        },
        topTracks: {
          shortTerm: tracksShort,
          mediumTerm: tracksMedium,
          longTerm: tracksLong,
        },
        genres,
        playlists,
      }

      progress.value = '完了!'
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  function exportJson() {
    if (!result.value) return
    const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spotify-analysis-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    loading,
    progress,
    error,
    result,
    canAnalyze,
    runAnalysis,
    exportJson,
  }
}
