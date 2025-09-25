import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useSpotifyAuthContext } from "../context/SpotifyAuthContext.js";

interface ImageLike {
  url: string;
}

interface ArtistLike {
  name: string;
}

interface TrackLike {
  name: string;
  album?: {
    images?: ImageLike[];
  };
  artists?: ArtistLike[];
}

export function TrackPage() {
  const { status, client, error } = useSpotifyAuthContext();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [track, setTrack] = useState<TrackLike | null>(null);
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

  useEffect(() => {
    if (!client || !isAuthenticated) {
      setTrack(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setApiError(null);

    (async () => {
      try {
        const response = await client.player.getCurrentlyPlayingTrack();

        if (cancelled) {
          return;
        }

        setTrack((response && "item" in response ? (response.item as TrackLike) : null) ?? null);
      } catch (err) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err : new Error(String(err)));
          setTrack(null);
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
    </main>
  );
}
