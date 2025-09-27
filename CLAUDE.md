# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `npm run dev` - Start development server on http://localhost:3000
- **Build**: `npm run build` - Build the application for production
- **Generate**: `npm run generate` - Generate static site
- **Preview**: `npm run preview` - Preview the production build locally

## Environment Setup

This app requires Spotify OAuth configuration. Set these environment variables:

```bash
NUXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NUXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
NUXT_PUBLIC_SPOTIFY_SCOPES=user-read-email,user-read-currently-playing,user-read-playback-state
```

The app will display configuration errors if these are missing.

## Architecture

### Authentication Flow
- Uses Spotify OAuth with PKCE flow via `@spotify/web-api-ts-sdk`
- `src/composables/useSpotifyAuth.ts` manages global auth state (idle/authenticating/authenticated/error)
- `src/composables/useSpotifyConfig.ts` handles environment variable parsing and validation
- `src/utils/spotify.ts` creates Spotify API client instances

### State Management
- Authentication state is managed through reactive composables, not Vuex/Pinia
- Auth state persists across page reloads using SDK's token storage
- Config changes automatically trigger auth re-initialization

### Routing & Pages
- `/` - Home page with user profile and auth status (src/pages/index.vue)
- `/login` - OAuth initiation page (src/pages/login.vue)
- `/callback` - OAuth callback handler (src/pages/callback.vue)
- `/track` - Now playing track details (src/pages/track.vue)

### UI Framework
- Nuxt 3 with SPA mode (`ssr: false`)
- Vuetify 3 for components with custom theming
- SCSS animations in `src/assets/styles/animations.scss`
- Custom animation composables in `src/composables/useAnimations.ts`

### Key Technical Patterns
- Environment config validation happens at app startup in `src/app.vue`
- All Spotify API calls go through the centralized client from `useSpotifyAuth`
- Composables follow Vue 3 composition API patterns with proper reactivity
- Pages use computed properties derived from auth state for conditional rendering
- Authentication errors are handled gracefully with user-friendly messages in Japanese