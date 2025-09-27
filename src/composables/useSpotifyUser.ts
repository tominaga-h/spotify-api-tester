import { computed, watch } from 'vue'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useCachedAsyncState } from './useAsyncState'
import { createSpotifyService, type SpotifyProfile } from '@/services/spotifyService'

export function useSpotifyUser() {
  const { client, status } = useSpotifyAuth()

  const {
    data: profile,
    loading,
    error,
    execute: fetchProfile,
    refresh: refreshProfile,
    reset
  } = useCachedAsyncState(
    async (): Promise<SpotifyProfile | null> => {
      const spotifyClient = client.value
      if (!spotifyClient || status.value !== 'authenticated') {
        return null
      }

      const service = createSpotifyService(spotifyClient)
      return service.getCurrentUser()
    },
    null,
    () => 'current-user' // Cache key
  )

  // Auto-fetch when client becomes available
  watch(
    [() => client.value, () => status.value],
    () => {
      if (client.value && status.value === 'authenticated') {
        fetchProfile()
      } else {
        reset()
      }
    },
    { immediate: true }
  )

  // Computed properties
  const profileImage = computed(() => profile.value?.images?.[0]?.url ?? null)

  const displayName = computed(() => profile.value?.display_name ?? '')

  const isProfileLoaded = computed(() => !!profile.value && status.value === 'authenticated')

  return {
    // Data
    profile,

    // Computed
    profileImage,
    displayName,
    isProfileLoaded,

    // State
    loading,
    error,

    // Actions
    fetchProfile,
    refreshProfile,
    reset
  }
}