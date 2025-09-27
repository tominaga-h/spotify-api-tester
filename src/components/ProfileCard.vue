<template>
  <div v-if="profile" class="profile-section">
    <div class="profile-avatar">
      <img v-if="profileImage" :src="profileImage" alt="Profile" class="profile-avatar__image" />
      <div v-else class="profile-avatar__placeholder">
        <VIcon icon="mdi-account" size="32" />
      </div>
    </div>
    <div class="profile-info">
      <h3 class="profile-name">{{ profile.display_name }}</h3>
      <p class="profile-status">Connected</p>
    </div>
  </div>
  <div v-else class="connection-placeholder">
    <div class="connection-placeholder__icon">
      <VIcon icon="mdi-music" size="48" />
    </div>
    <p class="connection-placeholder__text">Connect to Spotify</p>
  </div>
</template>

<script setup lang="ts">
interface SpotifyProfile {
  display_name: string
  email: string
  id: string
  images?: { url: string }[]
}

interface Props {
  profile: SpotifyProfile | null
}

const props = defineProps<Props>()

const profileImage = computed(() => props.profile?.images?.[0]?.url ?? null)
</script>

<style lang="scss">
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
</style>