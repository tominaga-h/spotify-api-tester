import type { SpotifyApi } from '@spotify/web-api-ts-sdk'

export interface SpotifyProfile {
  display_name: string
  email: string
  id: string
  images?: { url: string }[]
}

export interface SpotifyTrack {
  id?: string
  uri?: string
  name?: string
  album?: {
    name?: string
    images?: { url: string; width?: number; height?: number }[]
  }
  artists?: { name: string }[]
}

export interface PlaylistTrack {
  id: string
  name: string
  artists: string[]
}

export interface SpotifyPlaylist {
  id: string
  name: string
  tracks: PlaylistTrack[]
}

export interface SpotifyDevice {
  id?: string
  name?: string
  is_active?: boolean
}

export interface CurrentPlayback {
  track: SpotifyTrack | null
  device: SpotifyDevice | null
  context?: {
    type?: string
    uri?: string
  }
}

export class SpotifyService {
  constructor(private client: SpotifyApi) {}

  async getCurrentUser(): Promise<SpotifyProfile> {
    const profile = await this.client.currentUser.profile()
    return profile as SpotifyProfile
  }

  async getCurrentlyPlaying(): Promise<CurrentPlayback> {
    const response = await this.client.player.getCurrentlyPlayingTrack()

    return {
      track: response && 'item' in response ? (response.item as SpotifyTrack) : null,
      device: response?.device ?? null,
      context: response?.context
    }
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    const playlistResponse = await this.client.playlists.getPlaylist(playlistId)
    const items = playlistResponse.tracks?.items ?? []

    const tracks = items
      .map((item, index) => {
        const playlistTrack = item?.track as SpotifyTrack | null
        if (!playlistTrack) {
          return null
        }

        const trackId = playlistTrack.id ?? playlistTrack.uri ?? `playlist-track-${index}`

        return {
          id: trackId,
          name: playlistTrack.name ?? 'Unknown',
          artists: playlistTrack.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
        }
      })
      .filter((item): item is PlaylistTrack => Boolean(item))

    return {
      id: playlistResponse.id,
      name: playlistResponse.name,
      tracks,
    }
  }

  async getAvailableDevices(): Promise<SpotifyDevice[]> {
    const response = await this.client.player.getAvailableDevices()
    return response.devices as SpotifyDevice[]
  }

  async transferPlayback(deviceIds: string[], play?: boolean): Promise<void> {
    await this.client.player.transferPlayback(deviceIds, play)
  }

  async skipToNext(deviceId?: string): Promise<void> {
    if (deviceId) {
      await this.client.player.skipToNext(deviceId)
    } else {
      await (this.client.player.skipToNext as unknown as () => Promise<void>)()
    }
  }

  async skipToPrevious(deviceId?: string): Promise<void> {
    if (deviceId) {
      await this.client.player.skipToPrevious(deviceId)
    } else {
      await (this.client.player.skipToPrevious as unknown as () => Promise<void>)()
    }
  }

  extractPlaylistIdFromContext(context?: { type?: string; uri?: string }): string | null {
    if (context?.type === 'playlist' && typeof context.uri === 'string') {
      return context.uri.split(':').pop() ?? null
    }
    return null
  }

  getAlbumImage(track: SpotifyTrack | null): string | null {
    if (!track?.album?.images?.length) {
      return null
    }
    return track.album.images[0].url
  }

  getArtistNames(track: SpotifyTrack | null): string {
    if (!track?.artists?.length) {
      return ''
    }
    return track.artists.map((artist) => artist.name).join(', ')
  }
}

export function createSpotifyService(client: SpotifyApi): SpotifyService {
  return new SpotifyService(client)
}