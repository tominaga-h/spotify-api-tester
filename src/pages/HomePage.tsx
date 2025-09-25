import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useSpotifyAuthContext } from "../context/SpotifyAuthContext.js";

interface SpotifyProfile {
  display_name: string;
  email: string;
  id: string;
  images?: { url: string }[];
}

export function HomePage() {
  const navigate = useNavigate();
  const { config, status, error, client } = useSpotifyAuthContext();
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);

  useEffect(() => {
    if (!client) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const profileResponse = await client.currentUser.profile();
        console.log(await client.player.getCurrentlyPlayingTrack("ES"));

        if (!cancelled) {
          setProfile(profileResponse as SpotifyProfile);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client]);

  const handleNavigateToLogin = () => {
    navigate("/login");
  };

  return (
    <main className="container">
      <header>
        <h1>Spotify OAuth React Demo</h1>
        <p>
          Client ID: <code>{config.clientId}</code>
        </p>
        <p>
          Redirect URI: <code>{config.redirectUri}</code>
        </p>
        <p>
          Scopes: <code>{config.scopes.join(", ")}</code>
        </p>
      </header>

      <section>
        <h2>Status</h2>
        <p>
          {status === "authenticated" && "Authenticated"}
          {status === "authenticating" && "Redirecting to Spotify…"}
          {status === "idle" && "Not authenticated"}
          {status === "error" && "Authentication failed"}
        </p>
        {error ? <pre className="error">{error.message}</pre> : null}
        <button type="button" onClick={handleNavigateToLogin}>
          {status === "authenticated" ? "Re-authenticate" : "Sign in with Spotify"}
        </button>
      </section>

      <section>
        <h2>Profile</h2>
        {profile ? (
          <article className="profile">
            {profile.images?.[0]?.url ? (
              <img
                src={profile.images[0].url}
                alt="Spotify avatar"
                className="profile__avatar"
              />
            ) : null}
            <dl>
              <dt>Name</dt>
              <dd>{profile.display_name}</dd>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
              <dt>User ID</dt>
              <dd>{profile.id}</dd>
            </dl>
          </article>
        ) : (
          <p>No profile loaded yet.</p>
        )}
      </section>

      <section>
        <h2>Now Playing</h2>
        <p>
          View the currently playing track on the <Link to="/track">Now Playing page</Link>.
        </p>
      </section>
    </main>
  );
}
