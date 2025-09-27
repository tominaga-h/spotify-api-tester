<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSpotifyAuth } from '@/composables/useSpotifyAuth';
import AlertCard from '@/components/AlertCard.vue';
import ActionButton from '@/components/ActionButton.vue';

const router = useRouter();
const { status, error, authenticate } = useSpotifyAuth();

const started = ref(false);

watch(
  () => status.value,
  (currentStatus) => {
    if (currentStatus === 'authenticated') {
      router.replace('/');
      return;
    }

    if (started.value || currentStatus === 'authenticating') {
      return;
    }

    started.value = true;
    authenticate().catch((err) => {
      console.error(err);
    });
  },
  { immediate: true }
);

watch(
  () => status.value,
  (currentStatus) => {
    if (currentStatus === 'error') {
      started.value = false;
    }
  }
);

const isAuthenticating = computed(() => status.value === 'authenticating');
const isError = computed(() => status.value === 'error');

// Clean minimal authentication logic only
</script>

<template>
  <div class="login-page">
    <div class="login-container">
          <div class="login-card glass-card">
            <div class="login-header">
              <h1 class="login-title">
                <span class="login-title__primary">Authentication</span>
                <span class="login-title__secondary">Required</span>
              </h1>
              <p class="login-description">
                Connect to Spotify to access your music data.
              </p>
            </div>

            <AlertCard
              v-if="isError"
              type="error"
              message="認証に失敗しました。環境設定を見直し、もう一度お試しください。"
              :details="error.value?.message"
            />

            <div v-else class="login-status">
              <div class="status-icon">
                <VProgressCircular
                  v-if="isAuthenticating"
                  indeterminate
                  color="#5c7c9b"
                  size="32"
                  width="2"
                />
                <VIcon v-else icon="mdi-lock" size="32" color="var(--base-600)" />
              </div>
              <div class="status-text">
                <p class="status-message">
                  {{ isAuthenticating ? 'Connecting...' : 'Ready to authenticate' }}
                </p>
              </div>
            </div>

            <div class="login-actions">
              <ActionButton
                variant="primary"
                :disabled="isAuthenticating"
                @click="authenticate()"
                class="auth-btn"
              >
                {{ isAuthenticating ? 'Connecting...' : 'Sign In' }}
              </ActionButton>
              <p class="login-note">
                Secure OAuth authentication required.
              </p>
            </div>
          </div>
    </div>
  </div>
</template>

<style lang="scss">
// Minimal Login Page
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--base-050);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: var(--space-8);
}

// Clean Login Card
.login-card {
  background: var(--base-100);
  border: var(--border-subtle);
  border-radius: var(--radius-sharp);
  box-shadow: var(--shadow-neumorphic-flat);
  padding: var(--space-12);
  transition: all var(--duration-normal) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-neumorphic-raised);
  }
}

// Minimal Header
.login-header {
  margin-bottom: var(--space-10);
  text-align: center;
}

.login-title {
  font-size: var(--text-4xl);
  font-family: var(--font-display);
  line-height: 1;
  margin-bottom: var(--space-4);
  color: var(--base-900);
}

.login-title__primary {
  display: block;
  font-variation-settings: 'wght' 800;
  background: var(--gradient-neon-2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: textGlow 3s ease-in-out infinite;
}

.login-title__secondary {
  display: block;
  font-variation-settings: 'wght' 200;
  color: var(--base-600);
  margin-top: var(--space-1);
}

.login-description {
  font-size: var(--text-base);
  color: var(--base-600);
  font-variation-settings: 'wght' 400;
  line-height: 1.5;
  margin: 0;
}

// Status Section
.login-status {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  padding: var(--space-4);
  background: var(--base-050);
  border: var(--border-muted);
  border-radius: var(--radius-sharp);
}

.status-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--base-100);
  border-radius: var(--radius-sharp);
  border: var(--border-subtle);
}

.status-text {
  flex: 1;
}

.status-message {
  font-size: var(--text-sm);
  color: var(--base-700);
  font-variation-settings: 'wght' 500;
  margin: 0;
}

// Actions Section
.login-actions {
  margin-bottom: var(--space-6);
}

.auth-btn {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  background: var(--gradient-neon-3);
  color: var(--base-white);
  border: 2px solid var(--neon-orange);
  border-radius: var(--radius-sharp);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-variation-settings: 'wght' 600;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-neumorphic-flat), var(--glow-orange);
  margin-bottom: var(--space-4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-rainbow);
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-out);
  }

  &:hover:not(:disabled) {
    box-shadow: var(--shadow-neumorphic-pressed), var(--glow-purple);
    border-color: var(--neon-purple);
    animation: neonPulse 1.5s ease-in-out infinite;
    transform: translateY(1px);

    &::before {
      opacity: 0.8;
    }
  }

  &:active:not(:disabled) {
    box-shadow: var(--shadow-neumorphic-pressed), var(--glow-electric);
    transform: translateY(2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(1);
  }
}

.login-note {
  font-size: var(--text-sm);
  color: var(--base-500);
  text-align: center;
  line-height: 1.4;
  margin: 0;
  font-variation-settings: 'wght' 400;
}

// Error Alert Override
.v-alert {
  background: var(--base-100) !important;
  border: var(--border-subtle) !important;
  border-radius: var(--radius-sharp) !important;
  box-shadow: var(--shadow-neumorphic-flat) !important;
  margin-bottom: var(--space-6) !important;
}

// Responsive Design
@media (max-width: 500px) {
  .login-container {
    padding: var(--space-6);
  }

  .login-card {
    padding: var(--space-8);
  }

  .login-title {
    font-size: var(--text-3xl);
  }
}
</style>
