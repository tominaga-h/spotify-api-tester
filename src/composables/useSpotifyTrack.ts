import { computed, ref, watch } from 'vue'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useAsyncState } from './useAsyncState'
import { createSpotifyService, type SpotifyTrack, type SpotifyDevice, type CurrentPlayback } from '@/services/spotifyService'

export function useSpotifyTrack() {
  const { client, status } = useSpotifyAuth()
  const refreshTrigger = ref(0)

  const {
    data: currentPlayback,
    loading,
    error,
    execute: fetchCurrentTrack
  } = useAsyncState(async (): Promise<CurrentPlayback | null> => {
    const spotifyClient = client.value
    if (!spotifyClient || status.value !== 'authenticated') {
      return null
    }

    const service = createSpotifyService(spotifyClient as any)
    return service.getCurrentlyPlaying()
  })

  // Computed properties for easy access
  const track = computed(() => currentPlayback.value?.track ?? null)
  const device = computed(() => currentPlayback.value?.device ?? null)
  const context = computed(() => currentPlayback.value?.context)

  const albumImage = computed(() => {
    if (!track.value) return null
    const service = createSpotifyService(client.value! as any)
    return service.getAlbumImage(track.value)
  })

  const artistNames = computed(() => {
    if (!track.value) return ''
    const service = createSpotifyService(client.value! as any)
    return service.getArtistNames(track.value)
  })

  const trackTitle = computed(() => track.value?.name ?? '現在再生中のトラックはありません')

  const trackSubtitle = computed(() =>
    track.value
      ? artistNames.value || 'アーティスト情報が取得できませんでした'
      : 'Spotify を再生して現在のトラックをここに表示しましょう。'
  )

  const deviceStatus = computed(() => {
    if (device.value?.id) {
      return {
        icon: 'mdi-speaker-wave',
        text: `再生デバイス ID: ${device.value.id}`,
        tone: 'success' as const,
      }
    }

    return {
      icon: 'mdi-speaker-off',
      text: 'アクティブな Spotify デバイスが検出されません',
      tone: 'warning' as const,
    }
  })

  // Auto-fetch when client or refresh trigger changes
  watch(
    [() => client.value, () => status.value, () => refreshTrigger.value],
    () => {
      if (client.value && status.value === 'authenticated') {
        fetchCurrentTrack()
      }
    },
    { immediate: true }
  )

  const refresh = () => {
    refreshTrigger.value += 1
  }

  // Playback controls
  const {
    loading: controlLoading,
    error: controlError,
    execute: executeControl
  } = useAsyncState(async (action: 'next' | 'previous') => {
    const spotifyClient = client.value
    if (!spotifyClient || status.value !== 'authenticated') {
      throw new Error('Not authenticated')
    }

    const service = createSpotifyService(spotifyClient as any)

    // Try to ensure we have an active device
    const deviceId = await ensureActiveDevice(service)

    const attemptAction = async (targetDeviceId: string | null) => {
      if (action === 'next') {
        await service.skipToNext(targetDeviceId || undefined)
      } else {
        await service.skipToPrevious(targetDeviceId || undefined)
      }
    }

    try {
      await attemptAction(deviceId)
      await fetchCurrentTrack()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      // Retry without device ID if we get certain errors
      if (/502/.test(message) || /NO_ACTIVE_DEVICE/.test(message) || /Bad gateway/i.test(message)) {
        await attemptAction(null)
      } else {
        throw err
      }

      await fetchCurrentTrack()
    }

    // Refresh track info after control action
    await fetchCurrentTrack()
  })

  const skipNext = () => executeControl('next')
  const skipPrevious = () => executeControl('previous')

  // Helper function to ensure active device
  const ensureActiveDevice = async (service: ReturnType<typeof createSpotifyService>): Promise<string | null> => {
    if (device.value?.id) {
      return device.value.id
    }

    try {
      const devices = await service.getAvailableDevices()
      const activeDevice = devices.find((d) => d.is_active && d.id)

      if (activeDevice?.id) {
        return activeDevice.id
      }

      const fallbackDevice = devices.find((d) => d.id)
      if (fallbackDevice?.id) {
        await service.transferPlayback([fallbackDevice.id], true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        return fallbackDevice.id
      }
    } catch (err) {
      console.warn('Failed to get devices:', err)
    }

    throw new Error('アクティブなSpotifyデバイスが見つかりません。Spotifyを開いて再生を開始してください。')
  }

  return {
    // Data
    track,
    device,
    context,
    currentPlayback,

    // Computed
    albumImage,
    artistNames,
    trackTitle,
    trackSubtitle,
    deviceStatus,

    // State
    loading,
    error,
    controlLoading,
    controlError,

    // Actions
    refresh,
    skipNext,
    skipPrevious,
    fetchCurrentTrack
  }
}
