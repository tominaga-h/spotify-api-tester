import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useSpotifyAuthContext } from "../context/SpotifyAuthContext.js";

interface ImageLike {
  url: string;
}

interface ArtistLike {
  name: string;
}

interface TrackLike {
  id?: string;
  uri?: string;
  name?: string;
  album?: {
    images?: ImageLike[];
  };
  artists?: ArtistLike[];
}

interface PlaylistSummary {
  id: string;
  name: string;
  tracks: Array<{
    id: string;
    name: string;
    artists: string[];
  }>;
}

const MAX_PLAYLIST_TRACKS = 25;

export function TrackPage() {
  const { status, client, error } = useSpotifyAuthContext();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [track, setTrack] = useState<TrackLike | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistSummary | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const isAuthenticating = status === "authenticating";
  const isAuthenticated = status === "authenticated" && !!client;

  const albumImage = useMemo(() => {
    if (!track?.album?.images?.length) {
      return null;
    }

    return track.album.images[0]?.url ?? null;
  }, [track]);

  const artistNames = useMemo(() => {
    if (!track?.artists?.length) {
      return "";
    }

    return track.artists.map((artist) => artist.name).join(", ");
  }, [track]);

  const playlistLink = useMemo(() => {
    if (!playlist) {
      return null;
    }

    return `https://open.spotify.com/playlist/${playlist.id}`;
  }, [playlist]);

  useEffect(() => {
    if (!client || !isAuthenticated) {
      setTrack(null);
      setDeviceId(null);
      setPlaylist(null);
      setPlaylistLoading(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setApiError(null);
    setPlaylistError(null);
    setPlaylist(null);
    setPlaylistLoading(false);

    (async () => {
      try {
        const response = await client.player.getCurrentlyPlayingTrack();

        if (cancelled) {
          return;
        }

        setDeviceId(response?.device?.id ?? null);
        setTrack((response && "item" in response ? (response.item as TrackLike) : null) ?? null);

        const context = response?.context;

        if (context?.type === "playlist" && typeof context.uri === "string") {
          const playlistId = context.uri.split(":").pop() ?? "";

          if (playlistId) {
            setPlaylistLoading(true);

            try {
              const playlistResponse = await client.playlists.getPlaylist(playlistId);

              if (cancelled) {
                return;
              }

              const items = playlistResponse.tracks?.items ?? [];

              const tracks = items
                .map((item, index) => {
                  const playlistTrack = item?.track as TrackLike | null;
                  if (!playlistTrack) {
                    return null;
                  }

                  const trackId = playlistTrack.id ?? playlistTrack.uri ?? `playlist-track-${index}`;

                  return {
                    id: trackId,
                    name: playlistTrack.name ?? "Unknown",
                    artists:
                      playlistTrack.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
                  };
                })
                .filter((item): item is PlaylistSummary["tracks"][number] => Boolean(item));

              setPlaylist({
                id: playlistResponse.id,
                name: playlistResponse.name,
                tracks,
              });
              setPlaylistError(null);
            } catch (err) {
              if (!cancelled) {
                setPlaylistError(err instanceof Error ? err : new Error(String(err)));
                setPlaylist(null);
              }
            } finally {
              if (!cancelled) {
                setPlaylistLoading(false);
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err : new Error(String(err)));
          setTrack(null);
          setDeviceId(null);
          setPlaylist(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, isAuthenticated, refreshTick]);

  const handleRefresh = () => {
    if (!isAuthenticated || !client) {
      return;
    }

    setRefreshTick((tick) => tick + 1);
  };

  const ensureActivePlaybackDevice = useCallback(async (): Promise<string | null> => {
    if (!client) {
      return null;
    }

    if (deviceId) {
      return deviceId;
    }

    try {
      const devices = await client.player.getAvailableDevices();

      const activeDevice = devices.devices.find((device) => device.is_active && device.id);

      if (activeDevice?.id) {
        setDeviceId(activeDevice.id);
        return activeDevice.id;
      }

      const fallbackDevice = devices.devices.find((device) => device.id);

      if (fallbackDevice?.id) {
        try {
          await client.player.transferPlayback([fallbackDevice.id], true);
          // Give Spotify a moment to finalize playback transfer before issuing skip commands.
          await new Promise((resolve) => setTimeout(resolve, 500));
          setDeviceId(fallbackDevice.id);
          return fallbackDevice.id;
        } catch (err) {
          setApiError(err instanceof Error ? err : new Error(String(err)));
          return null;
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }

    setApiError(
      new Error(
        "No active Spotify device found. Open Spotify on one of your devices and press play before using the controls."
      )
    );

    return null;
  }, [client, deviceId]);

  const handleSkip = async (direction: "previous" | "next") => {
    if (!isAuthenticated || !client) {
      return;
    }

    let shouldRefresh = false;

    try {
      setLoading(true);

      const targetDeviceId = await ensureActivePlaybackDevice();

      if (!targetDeviceId) {
        return;
      }

      const attemptSkip = async (device: string | null) => {
        if (direction === "next") {
          if (device) {
            await client.player.skipToNext(device);
          } else {
            await (client.player.skipToNext as unknown as (device_id?: string) => Promise<void>)();
          }
        } else {
          if (device) {
            await client.player.skipToPrevious(device);
          } else {
            await (client.player.skipToPrevious as unknown as (device_id?: string) => Promise<void>)();
          }
        }
      };

      try {
        await attemptSkip(targetDeviceId);
        shouldRefresh = true;
        setApiError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        // Spotify occasionally returns 502 or NO_ACTIVE_DEVICE. Retry once without specifying the device.
        if (/502/.test(message) || /NO_ACTIVE_DEVICE/.test(message) || /Bad gateway/i.test(message)) {
          try {
            await attemptSkip(null);
            shouldRefresh = true;
            setDeviceId(null); // force re-detection next run
            setApiError(null);
          } catch (retryErr) {
            setApiError(
              retryErr instanceof Error
                ? retryErr
                : new Error(String(retryErr))
            );
          }
        } else {
          setApiError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    } finally {
      setLoading(false);

      if (shouldRefresh) {
        setRefreshTick((tick) => tick + 1);
      }
    }
  };

  if (status === "idle" || status === "error") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="container">
      <header>
        <h1>Now Playing</h1>
        <p>
          <Link to="/">Home</Link>
        </p>
      </header>

      {isAuthenticating && <p>Waiting for Spotify authentication…</p>}

      {error ? <pre className="error">{error.message}</pre> : null}
      {apiError ? <pre className="error">{apiError.message}</pre> : null}

      <section>
        <div className="section-actions">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={!isAuthenticated || loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <div className="player-controls">
            <button
              type="button"
              onClick={() => handleSkip("previous")}
              disabled={!isAuthenticated || loading}
            >
              ⏮ Previous
            </button>
            <button
              type="button"
              onClick={() => handleSkip("next")}
              disabled={!isAuthenticated || loading}
            >
              Next ⏭
            </button>
          </div>
        </div>
        {loading ? (
          <p>Loading track information…</p>
        ) : track ? (
          <article className="profile">
            {albumImage ? (
              <img
                src={albumImage}
                alt="Album artwork"
                className="profile__avatar"
              />
            ) : null}
            <dl>
              <dt>Track</dt>
              <dd>{track.name ?? "Unknown"}</dd>
              <dt>Artist</dt>
              <dd>{artistNames || "Unknown"}</dd>
            </dl>
          </article>
        ) : (
          <p>No track is currently playing.</p>
        )}
      </section>

      <section>
        <h2>Playlist</h2>
        {playlistError ? <pre className="error">{playlistError.message}</pre> : null}
        {playlistLoading ? (
          <p>Loading playlist information…</p>
        ) : playlist ? (
          <div>
            <p>
              Playlist:{" "}
              {playlistLink ? (
                <a href={playlistLink} target="_blank" rel="noopener noreferrer">
                  {playlist.name}
                </a>
              ) : (
                playlist.name
              )}
            </p>
            <ol className="playlist-tracks">
              {playlist.tracks.slice(0, MAX_PLAYLIST_TRACKS).map((item, index) => (
                <li key={item.id || `playlist-${index}`}>
                  <strong>{item.name}</strong>
                  {item.artists.length ? ` — ${item.artists.join(", ")}` : null}
                </li>
              ))}
            </ol>
            {playlist.tracks.length > MAX_PLAYLIST_TRACKS ? (
              <p>
                Showing first {MAX_PLAYLIST_TRACKS} tracks of {playlist.tracks.length}. View the
                full playlist on Spotify for the complete list.
              </p>
            ) : null}
          </div>
        ) : (
          <p>The current track is not playing from a playlist.</p>
        )}
      </section>
    </main>
  );
}
