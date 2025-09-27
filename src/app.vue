<script setup lang="ts">
import { computed, watch } from 'vue';

import { useSpotifyConfig } from '@/composables/useSpotifyConfig';
import { initSpotifyAuth } from '@/composables/useSpotifyAuth';

const { config, error } = useSpotifyConfig();

watch(
  config,
  (value) => {
    if (value) {
      initSpotifyAuth(value);
    }
  },
  { immediate: true }
);

const configError = computed(() => error?.value);
</script>

<template>
  <VApp>
    <div class="app-background">
      <div class="gradient gradient--primary" />
      <div class="gradient gradient--accent" />
    </div>
    <VMain class="app-main">
      <NuxtLoadingIndicator color="#1db954" />
      <div class="app-wrapper">
        <VFadeTransition mode="out-in">
          <div v-if="configError" key="config-error" class="config-error">
            <VAlert
              type="error"
              border="start"
              variant="tonal"
              class="config-error__alert"
            >
              <div class="text-h5 font-weight-bold mb-3">Spotify 環境設定エラー</div>
              <p class="mb-2">{{ configError.message }}</p>
              <p class="mb-0">
                <code>NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code>
                など環境変数を設定してください。
              </p>
            </VAlert>
          </div>
          <NuxtPage v-else key="page" />
        </VFadeTransition>
      </div>
    </VMain>
  </VApp>
</template>

<style lang="scss">
// Revolutionary Design System - Minimalist × Neomorphism
:root {
  // Monochromatic Base Palette - Deep Dark Foundation
  --base-000: #0a0a0b;      // True black - deepest shadow
  --base-050: #111113;      // Primary background
  --base-100: #18181b;      // Secondary background
  --base-150: #212124;      // Tertiary surface
  --base-200: #2a2a2e;      // Interactive elements
  --base-250: #34343a;      // Elevated surfaces
  --base-300: #404049;      // Borders and dividers
  --base-400: #525262;      // Disabled text
  --base-500: #6b6b7d;      // Placeholder text
  --base-600: #8b8ba7;      // Secondary text
  --base-700: #b4b4d1;      // Primary text subdued
  --base-800: #e4e4f1;      // Primary text
  --base-900: #f8f8fc;      // Highest contrast text
  --base-white: #ffffff;    // Pure white (accent)

  // Monochromatic Accent - Single Hue System
  --accent-50: #0f1419;     // Deepest accent
  --accent-100: #1a2332;    // Dark accent background
  --accent-200: #243447;    // Accent surface
  --accent-300: #2f455c;    // Accent border
  --accent-400: #3a5771;    // Accent interactive
  --accent-500: #4a6986;    // Primary accent
  --accent-600: #5c7c9b;    // Accent hover
  --accent-700: #7091b0;    // Accent active
  --accent-800: #8aa8c5;    // Accent text
  --accent-900: #a8c1da;    // Accent highlight

  // Vivid Neon Palette - Flashy Accents
  --neon-electric: #00ffff;      // Electric cyan
  --neon-pink: #ff0080;          // Hot pink
  --neon-green: #00ff41;         // Electric green
  --neon-purple: #8000ff;        // Electric purple
  --neon-orange: #ff4000;        // Electric orange
  --neon-yellow: #ffff00;        // Electric yellow
  --neon-blue: #0080ff;          // Electric blue

  // Gradient Combinations
  --gradient-neon-1: linear-gradient(135deg, var(--neon-electric) 0%, var(--neon-pink) 100%);
  --gradient-neon-2: linear-gradient(135deg, var(--neon-green) 0%, var(--neon-purple) 100%);
  --gradient-neon-3: linear-gradient(135deg, var(--neon-orange) 0%, var(--neon-yellow) 100%);
  --gradient-rainbow: linear-gradient(135deg, var(--neon-electric) 0%, var(--neon-pink) 25%, var(--neon-green) 50%, var(--neon-purple) 75%, var(--neon-orange) 100%);

  // Semantic Colors - Enhanced with Neon
  --status-success: var(--neon-green);
  --status-warning: var(--neon-orange);
  --status-error: var(--neon-pink);
  --status-info: var(--neon-electric);

  // Revolutionary Typography - Variable Font System
  --font-primary: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', 'SF Mono', monospace;
  --font-display: 'Inter Variable', 'Inter', sans-serif;

  // Fluid Typography Scale
  --text-xs: clamp(0.694rem, 0.664rem + 0.152vw, 0.8rem);
  --text-sm: clamp(0.833rem, 0.789rem + 0.219vw, 1rem);
  --text-base: clamp(1rem, 0.932rem + 0.341vw, 1.25rem);
  --text-lg: clamp(1.2rem, 1.097rem + 0.513vw, 1.563rem);
  --text-xl: clamp(1.44rem, 1.287rem + 0.765vw, 1.953rem);
  --text-2xl: clamp(1.728rem, 1.504rem + 1.12vw, 2.441rem);
  --text-3xl: clamp(2.074rem, 1.748rem + 1.628vw, 3.052rem);
  --text-4xl: clamp(2.488rem, 2.02rem + 2.343vw, 3.815rem);
  --text-5xl: clamp(2.986rem, 2.322rem + 3.318vw, 4.768rem);

  // Precise Spacing System - Golden Ratio Based
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;    // 2px
  --space-1: 0.25rem;       // 4px
  --space-1-5: 0.375rem;    // 6px
  --space-2: 0.5rem;        // 8px
  --space-2-5: 0.625rem;    // 10px
  --space-3: 0.75rem;       // 12px
  --space-3-5: 0.875rem;    // 14px
  --space-4: 1rem;          // 16px
  --space-5: 1.25rem;       // 20px
  --space-6: 1.5rem;        // 24px
  --space-7: 1.75rem;       // 28px
  --space-8: 2rem;          // 32px
  --space-9: 2.25rem;       // 36px
  --space-10: 2.5rem;       // 40px
  --space-12: 3rem;         // 48px
  --space-14: 3.5rem;       // 56px
  --space-16: 4rem;         // 64px
  --space-20: 5rem;         // 80px
  --space-24: 6rem;         // 96px
  --space-32: 8rem;         // 128px
  --space-40: 10rem;        // 160px
  --space-48: 12rem;        // 192px
  --space-56: 14rem;        // 224px
  --space-64: 16rem;        // 256px

  // Sharp Edges Only - No Rounded Corners
  --radius-none: 0;
  --radius-sharp: 0;

  // Neomorphic Shadow System with Neon Glow
  --shadow-neumorphic-flat:
    inset 2px 2px 5px rgba(0, 0, 0, 0.3),
    inset -2px -2px 5px rgba(255, 255, 255, 0.015);

  --shadow-neumorphic-pressed:
    inset 4px 4px 8px rgba(0, 0, 0, 0.4),
    inset -4px -4px 8px rgba(255, 255, 255, 0.02);

  --shadow-neumorphic-raised:
    4px 4px 8px rgba(0, 0, 0, 0.5),
    -4px -4px 8px rgba(255, 255, 255, 0.015);

  --shadow-neumorphic-floating:
    8px 8px 16px rgba(0, 0, 0, 0.6),
    -8px -8px 16px rgba(255, 255, 255, 0.02);

  // Neon Glow Effects
  --glow-electric: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3), 0 0 60px rgba(0, 255, 255, 0.1);
  --glow-pink: 0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(255, 0, 128, 0.3), 0 0 60px rgba(255, 0, 128, 0.1);
  --glow-green: 0 0 20px rgba(0, 255, 65, 0.5), 0 0 40px rgba(0, 255, 65, 0.3), 0 0 60px rgba(0, 255, 65, 0.1);
  --glow-purple: 0 0 20px rgba(128, 0, 255, 0.5), 0 0 40px rgba(128, 0, 255, 0.3), 0 0 60px rgba(128, 0, 255, 0.1);

  // Minimalist Borders
  --border-subtle: 1px solid var(--base-300);
  --border-muted: 1px solid var(--base-250);
  --border-emphasis: 1px solid var(--base-400);
  --border-accent: 1px solid var(--accent-500);

  // Refined Animation System
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
  --duration-crawl: 1000ms;

  // Sophisticated Easing
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  // Background Patterns
  --pattern-noise: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

// Base Styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--base-800);
  background: var(--base-050);
  background-image: var(--pattern-noise);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-variation-settings: 'wght' 400;
}

// Revolutionary Typography - Variable Weight System
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-variation-settings: 'wght' 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--base-900);
}

h1 { font-size: var(--text-5xl); font-variation-settings: 'wght' 800; }
h2 { font-size: var(--text-4xl); font-variation-settings: 'wght' 700; }
h3 { font-size: var(--text-3xl); font-variation-settings: 'wght' 650; }
h4 { font-size: var(--text-2xl); font-variation-settings: 'wght' 600; }
h5 { font-size: var(--text-xl); font-variation-settings: 'wght' 550; }
h6 { font-size: var(--text-lg); font-variation-settings: 'wght' 500; }

// App Layout
.app-main {
  min-height: 100vh;
  position: relative;
  background-attachment: fixed;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-10) 0;
  position: relative;
  z-index: 10;
}

// Dynamic Background System with Neon Effects
.app-background {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: var(--base-050);
  overflow: hidden;
}

.gradient {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.gradient--primary {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -200px;
  background: var(--gradient-neon-1);
  animation-delay: 0s;
}

.gradient--accent {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -150px;
  background: var(--gradient-neon-2);
  animation-delay: 10s;
}

// Minimal Error Display
.config-error {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.config-error__alert {
  background: var(--base-100);
  border: var(--border-subtle);
  border-radius: var(--radius-sharp);
  box-shadow: var(--shadow-neumorphic-flat);
  padding: var(--space-8);
}

// Utility Classes
.text-gradient {
  background: var(--gradient-rainbow);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-premium);
}

// Enhanced Code Styling
code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// Enhanced Animations with Neon Effects
@keyframes float {
  0%, 100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  33% {
    transform: translate3d(30px, -30px, 0) rotate(2deg);
  }
  66% {
    transform: translate3d(-20px, 20px, 0) rotate(-2deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes neonPulse {
  0%, 100% {
    opacity: 0.8;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.2);
  }
}

@keyframes glowRotate {
  0% {
    filter: hue-rotate(0deg) brightness(1);
  }
  25% {
    filter: hue-rotate(90deg) brightness(1.1);
  }
  50% {
    filter: hue-rotate(180deg) brightness(1.2);
  }
  75% {
    filter: hue-rotate(270deg) brightness(1.1);
  }
  100% {
    filter: hue-rotate(360deg) brightness(1);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

@keyframes textGlow {
  0%, 100% {
    text-shadow: 0 0 5px currentColor;
  }
  50% {
    text-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.3),
    transparent
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.neon-pulse {
  animation: neonPulse 2s ease-in-out infinite;
}

.glow-rotate {
  animation: glowRotate 8s linear infinite;
}

.text-glow {
  animation: textGlow 3s ease-in-out infinite;
}

// Selection Styling
::selection {
  background: rgba(29, 215, 96, 0.3);
  color: white;
}

::-moz-selection {
  background: rgba(29, 215, 96, 0.3);
  color: white;
}

// Scrollbar Styling
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-gray-900);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gray-700);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-600);
}
</style>
