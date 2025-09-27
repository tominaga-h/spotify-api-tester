import { computed, watch, type Ref, type ComputedRef } from 'vue'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useAsyncState } from './useAsyncState'
import { createSpotifyService, type SpotifyPlaylist } from '@/services/spotifyService'

export function useSpotifyPlaylist(contextUriRef: Ref<string | undefined> | ComputedRef<string | undefined>) {
  const { client, status } = useSpotifyAuth()

  const {
    data: playlist,
    loading,
    error,
    execute: fetchPlaylist,
    reset
  } = useAsyncState(async (playlistId: string): Promise<SpotifyPlaylist | null> => {
    const spotifyClient = client.value
    if (!spotifyClient || status.value !== 'authenticated') {
      return null
    }

    const service = createSpotifyService(spotifyClient)
    return service.getPlaylist(playlistId)
  })

  // Extract playlist ID from context
  const playlistId = computed(() => {
    const contextUri = contextUriRef.value
    if (!contextUri || typeof contextUri !== 'string') return null

    if (!client.value) return null

    const service = createSpotifyService(client.value)
    return service.extractPlaylistIdFromContext({
      type: 'playlist',
      uri: contextUri
    })
  })

  // Auto-fetch when playlist ID changes
  watch(
    [() => playlistId.value, () => client.value, () => status.value],
    () => {
      if (playlistId.value && client.value && status.value === 'authenticated') {
        fetchPlaylist(playlistId.value)
      } else {
        reset()
      }
    },
    { immediate: true }
  )

  // Computed properties
  const playlistLink = computed(() => {
    if (!playlist.value) return null
    return `https://open.spotify.com/playlist/${playlist.value.id}`
  })

  const trackCount = computed(() => playlist.value?.tracks?.length ?? 0)

  const playlistSummary = computed(() => {
    if (!playlist.value) return 'プレイリスト情報はありません'
    return `${trackCount.value} 曲のプレイリスト`
  })

  const limitedTracks = computed(() => {
    const maxTracks = 25
    return playlist.value?.tracks?.slice(0, maxTracks) ?? []
  })

  const showLimitNotice = computed(() => trackCount.value > 25)

  const maxTracksDisplayed = 25

  return {
    // Data
    playlist,
    playlistId,

    // Computed
    playlistLink,
    trackCount,
    playlistSummary,
    limitedTracks,
    showLimitNotice,
    maxTracksDisplayed,

    // State
    loading,
    error,

    // Actions
    fetchPlaylist,
    reset
  }
}