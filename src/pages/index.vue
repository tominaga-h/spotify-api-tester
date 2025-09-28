<script setup lang="ts">
import { computed } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import { useSpotifyUser } from '@/composables/useSpotifyUser';
import StatusIndicator from '@/components/StatusIndicator.vue';
import ProfileCard from '@/components/ProfileCard.vue';
import ActionButton from '@/components/ActionButton.vue';

const router = useRouter();
const { status, logOut } = useSpotifyAuth();
const { profile } = useSpotifyUser();

const isAuthenticated = computed(() => status?.value === 'authenticated');

const handleNavigateToLogin = async () => {
  if (status?.value === 'authenticated') {
    logOut();
    await router.push({ path: '/login', query: { reauthenticate: '1' } });
    return;
  }

  await router.push('/login');
};

const navigateToTrack = () => {
  router.push('/track');
};

</script>

<template>
  <div class="home-page">

    <div class="hero-section">

      <div class="hero-content">
        <div class="hero-main">
          <StatusIndicator :status="status" />

          <h1 class="hero-title">
            <span class="hero-title__primary">Music</span>
            <span class="hero-title__secondary">Dashboard</span>
          </h1>

          <p class="hero-description">
            Real-time music experience through secure authentication.
          </p>

          <div class="hero-actions">
            <ActionButton variant="primary" @click="navigateToTrack">
              Now Playing
            </ActionButton>
            <ActionButton variant="secondary" @click="handleNavigateToLogin">
              {{ isAuthenticated ? 'Re-authenticate' : 'Sign In' }}
            </ActionButton>
          </div>
        </div>

        <div class="hero-visual">
          <ProfileCard :profile="isAuthenticated ? profile : null" />
        </div>
      </div>
    </div>




    <div class="current-track" v-if="isAuthenticated">
      <div class="track-info">
        <h2 class="track-title">Current Track</h2>
        <button class="track-btn" @click="navigateToTrack">
          <span>View Details</span>
          <VIcon icon="mdi-arrow-right" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.home-page {
  min-height: 100vh;
  padding: var(--space-12) var(--space-8);
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 80vh;
}

.hero-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-16);
  width: 100%;
  align-items: center;
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--base-500);
    transition: background-color var(--duration-normal) var(--ease-out);
  }

  &__text {
    font-size: var(--text-sm);
    color: var(--base-600);
    font-variation-settings: 'wght' 500;
  }

  &--success {
    .status-indicator__dot {
      background: var(--status-success);
      box-shadow: var(--glow-green);
      animation: neonPulse 2s ease-in-out infinite;
    }
  }

  &--warning {
    .status-indicator__dot {
      background: var(--status-warning);
    }
  }

  &--error {
    .status-indicator__dot {
      background: var(--status-error);
    }
  }
}

.hero-card {
  &__bg-elements {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }

  &__mesh {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(29, 215, 96, 0.06) 0%, transparent 50%);
    animation: meshFloat 20s ease-in-out infinite;
  }

  &__orbs {
    position: absolute;
    inset: 0;
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.6;
    animation: orbFloat 15s ease-in-out infinite;

    &--1 {
      width: 200px;
      height: 200px;
      top: -50px;
      right: -50px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
      animation-delay: 0s;
    }

    &--2 {
      width: 150px;
      height: 150px;
      bottom: -30px;
      left: -30px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
      animation-delay: 5s;
    }

    &--3 {
      width: 100px;
      height: 100px;
      top: 40%;
      left: 60%;
      background: radial-gradient(circle, rgba(29, 215, 96, 0.2) 0%, transparent 70%);
      animation-delay: 10s;
    }
  }

  &__sparkles {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &__sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
    border-radius: 50%;
    transform: translate(var(--sparkle-x), var(--sparkle-y));
    animation: sparkle var(--sparkle-duration) ease-in-out infinite var(--sparkle-delay);
  }

  &__badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 1rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    animation: fadeInDown 0.6s ease-out 0.2s both;

    &-glow {
      position: absolute;
      inset: -2px;
      border-radius: 999px;
      background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
      filter: blur(8px);
      opacity: 0;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

.hero-title {
  font-size: var(--text-5xl);
  font-family: var(--font-display);
  font-variation-settings: 'wght' 300;
  line-height: 0.9;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-6);
  color: var(--base-900);

  &__primary {
    display: block;
    font-variation-settings: 'wght' 800;
    background: var(--gradient-neon-1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: textGlow 3s ease-in-out infinite;
  }

  &__secondary {
    display: block;
    font-variation-settings: 'wght' 200;
    color: var(--base-600);
    margin-top: var(--space-2);
  }
}

.hero-description {
  font-size: var(--text-lg);
  line-height: 1.5;
  color: var(--base-600);
  margin-bottom: var(--space-10);
  font-variation-settings: 'wght' 400;
}

.text-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-12);
}

.action-btn {
  position: relative;
  padding: var(--space-3) var(--space-6);
  background: var(--base-100);
  border: var(--border-subtle);
  border-radius: var(--radius-sharp);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-variation-settings: 'wght' 500;
  color: var(--base-800);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-neumorphic-flat);

  &:hover {
    background: var(--base-150);
    box-shadow: var(--shadow-neumorphic-pressed);
    transform: translateY(1px);
  }

  &:active {
    box-shadow: var(--shadow-neumorphic-pressed);
    transform: translateY(2px);
  }

  &--primary {
    background: var(--gradient-neon-2);
    color: var(--base-white);
    border: 2px solid var(--neon-electric);
    box-shadow: var(--glow-electric);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--gradient-neon-3);
      opacity: 0;
      transition: opacity var(--duration-normal) var(--ease-out);
    }

    &:hover {
      box-shadow: var(--glow-pink);
      animation: neonPulse 1s ease-in-out infinite;

      &::before {
        opacity: 1;
      }
    }
  }

  &__text {
    display: block;
  }
}

// Hero Visual Section - Minimal Profile
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background: var(--base-100);
  border: 2px solid var(--neon-electric);
  border-radius: var(--radius-sharp);
  box-shadow: var(--shadow-neumorphic-flat), var(--glow-electric);
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-neon-1);
    opacity: 0.05;
    animation: glow-rotate 8s linear infinite;
  }

  &:hover {
    box-shadow: var(--shadow-neumorphic-raised), var(--glow-pink);
    border-color: var(--neon-pink);
    transform: translateY(-4px);
  }
}

.profile-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  overflow: hidden;
  border-radius: var(--radius-sharp);
  background: var(--base-150);
}

.profile-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--base-500);
}

.profile-info {
  text-align: center;
}

.profile-name {
  font-size: var(--text-lg);
  font-variation-settings: 'wght' 600;
  color: var(--base-900);
  margin-bottom: var(--space-1);
}

.profile-status {
  font-size: var(--text-sm);
  color: var(--status-success);
  font-variation-settings: 'wght' 500;
}

.connection-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background: var(--base-100);
  border: var(--border-muted);
  border-style: dashed;
  border-radius: var(--radius-sharp);
  color: var(--base-500);
  text-align: center;
}

.connection-placeholder__icon {
  opacity: 0.6;
}

.connection-placeholder__text {
  font-size: var(--text-sm);
  font-variation-settings: 'wght' 500;
  margin: 0;
}

// Current Track Section
.current-track {
  margin-top: var(--space-16);
  padding-top: var(--space-12);
  border-top: var(--border-subtle);
}

.track-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-title {
  font-size: var(--text-2xl);
  font-variation-settings: 'wght' 700;
  color: var(--base-900);
  margin: 0;
}

.track-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-sharp);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-variation-settings: 'wght' 500;
  color: var(--neon-purple);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-neon-2);
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-out);
  }

  &:hover {
    background: var(--base-100);
    border-color: var(--neon-electric);
    color: var(--neon-electric);
    box-shadow: var(--glow-electric);
    transform: translateX(8px);
    animation: neonPulse 2s ease-in-out infinite;

    &::before {
      opacity: 0.1;
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-12);
    text-align: center;
  }

  .hero-actions {
    justify-content: center;
  }

  .track-info {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }
}


</style>
