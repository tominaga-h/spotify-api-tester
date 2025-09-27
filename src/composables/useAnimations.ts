import { ref, computed } from 'vue';

// パーティクル生成のためのロジック
export function useParticleAnimations() {
  const particleCount = ref(20);
  const visualParticleCount = ref(8);

  // 背景パーティクルのスタイル生成
  const getParticleStyle = (index: number) => {
    const size = Math.random() * 4 + 2;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    return {
      '--particle-size': `${size}px`,
      '--particle-duration': `${duration}s`,
      '--particle-delay': `${delay}s`,
      '--particle-x': `${x}%`,
      '--particle-y': `${y}%`,
    };
  };

  // ビジュアルパーティクルのスタイル生成
  const getVisualParticleStyle = (index: number) => {
    const angle = (index / visualParticleCount.value) * 360;
    const radius = 120 + Math.random() * 40;
    const duration = 8 + Math.random() * 4;
    const delay = Math.random() * 2;

    return {
      '--particle-angle': `${angle}deg`,
      '--particle-radius': `${radius}px`,
      '--particle-duration': `${duration}s`,
      '--particle-delay': `${delay}s`,
    };
  };

  // パーティクル配列の生成
  const backgroundParticles = computed(() =>
    Array.from({ length: particleCount.value }, (_, i) => i)
  );

  const visualParticles = computed(() =>
    Array.from({ length: visualParticleCount.value }, (_, i) => i)
  );

  return {
    backgroundParticles,
    visualParticles,
    getParticleStyle,
    getVisualParticleStyle,
  };
}

// アニメーション遅延の計算ロジック
export function useAnimationDelays() {
  // カードのアニメーション遅延を計算
  const getCardDelay = (index: number, baseDelay: number = 0.2) =>
    `${index * baseDelay}s`;

  // リストアイテムのアニメーション遅延を計算
  const getListItemDelay = (index: number, baseDelay: number = 0.1) =>
    `${index * baseDelay}s`;

  // チップのアニメーション遅延を計算
  const getChipDelay = (index: number, baseDelay: number = 0.1) =>
    `${index * baseDelay}s`;

  return {
    getCardDelay,
    getListItemDelay,
    getChipDelay,
  };
}

// ホバーエフェクトの管理
export function useHoverEffects() {
  const hoveredElements = ref<Set<string>>(new Set());

  const isHovered = (elementId: string) =>
    hoveredElements.value.has(elementId);

  const setHovered = (elementId: string, hovered: boolean) => {
    if (hovered) {
      hoveredElements.value.add(elementId);
    } else {
      hoveredElements.value.delete(elementId);
    }
  };

  return {
    isHovered,
    setHovered,
  };
}

// アニメーション状態の管理
export function useAnimationState() {
  const animationEnabled = ref(true);
  const reducedMotion = ref(false);

  // ユーザーの動きの好みを検出
  const checkReducedMotion = () => {
    if (typeof window !== 'undefined') {
      reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  };

  // アニメーションの有効/無効を切り替え
  const toggleAnimations = () => {
    animationEnabled.value = !animationEnabled.value;
  };

  // アニメーションが有効かどうかを判定
  const shouldAnimate = computed(() =>
    animationEnabled.value && !reducedMotion.value
  );

  return {
    animationEnabled,
    reducedMotion,
    shouldAnimate,
    checkReducedMotion,
    toggleAnimations,
  };
}

// スクロールアニメーションの管理
export function useScrollAnimations() {
  const scrollY = ref(0);
  const isScrolling = ref(false);

  const updateScrollPosition = () => {
    scrollY.value = window.scrollY;
  };

  const handleScroll = () => {
    isScrolling.value = true;
    updateScrollPosition();

    // スクロール終了を検出
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
      isScrolling.value = false;
    }, 150);
  };

  // スクロール位置に基づくアニメーション遅延
  const getScrollBasedDelay = (elementOffset: number, multiplier: number = 0.1) => {
    const scrollProgress = Math.min(scrollY.value / elementOffset, 1);
    return `${scrollProgress * multiplier}s`;
  };

  return {
    scrollY,
    isScrolling,
    handleScroll,
    getScrollBasedDelay,
  };
}

// アニメーション用のユーティリティ関数
export function useAnimationUtils() {
  // イージング関数
  const easingFunctions = {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  // アニメーション時間のプリセット
  const durations = {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.6s',
    slower: '1s',
  };

  // 遅延のプリセット
  const delays = {
    immediate: '0s',
    short: '0.1s',
    medium: '0.2s',
    long: '0.4s',
  };

  // アニメーションスタイルの生成
  const createAnimationStyle = (options: {
    duration?: keyof typeof durations;
    delay?: keyof typeof delays;
    easing?: keyof typeof easingFunctions;
    customDuration?: string;
    customDelay?: string;
    customEasing?: string;
  }) => {
    const duration = options.customDuration || durations[options.duration || 'normal'];
    const delay = options.customDelay || delays[options.delay || 'immediate'];
    const easing = options.customEasing || easingFunctions[options.easing || 'easeOut'];

    return {
      transitionDuration: duration,
      transitionDelay: delay,
      transitionTimingFunction: easing,
    };
  };

  return {
    easingFunctions,
    durations,
    delays,
    createAnimationStyle,
  };
}
