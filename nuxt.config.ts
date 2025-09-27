import { defineNuxtConfig } from 'nuxt/config';
import vuetify from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  srcDir: 'src',
  ssr: false,
  devtools: { enabled: false },
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
    '@/assets/styles/main.scss'
  ],
  build: {
    transpile: ['vuetify']
  },
  runtimeConfig: {
    public: {
      spotifyClientId: process.env.NUXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
      spotifyRedirectUri: process.env.NUXT_PUBLIC_SPOTIFY_REDIRECT_URI || '',
      spotifyScopes: process.env.NUXT_PUBLIC_SPOTIFY_SCOPES || ''
    }
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    plugins: [
      vuetify({
        autoImport: true
      })
    ],
    define: {
      'process.env.DEBUG': false
    }
  }
});
