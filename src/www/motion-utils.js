/**
 * Motion Architecture - Phase D
 * Reusable motion utilities, keyframe generators, and animation helpers
 * All animations respect prefers-reduced-motion and run at 60fps
 */

// Design tokens (from Phase B)
const MOTION_TOKENS = {
  timing: {
    quick: '0.2s',
    smooth: '0.3s',
    dramatic: '0.5s',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * D1-01: Check if user prefers reduced motion
 * Returns true if prefers-reduced-motion: reduce is set
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * D1-02: Get safe animation duration
 * Returns zero if prefers-reduced-motion, otherwise returns requested duration
 */
export function getSafeDuration(durationMs) {
  return prefersReducedMotion() ? 0 : durationMs;
}

/**
 * D1-03: Get safe animation delay
 * Returns zero if prefers-reduced-motion, otherwise returns requested delay
 */
export function getSafeDelay(delayMs) {
  return prefersReducedMotion() ? 0 : delayMs;
}

/**
 * D1-04: Stagger delay calculator for sequential animations
 * D1-04 task: Calculate delay for nth item in a staggered sequence
 * @param {number} index - Item index (0-based)
 * @param {number} stepMs - Delay between items in milliseconds
 * @returns {number} Delay in milliseconds
 */
export function staggerDelay(index, stepMs = 50) {
  return index * stepMs;
}

/**
 * D1-05: Stagger delay calculator with offset
 * @param {number} index - Item index
 * @param {number} stepMs - Step delay
 * @param {number} offsetMs - Base offset
 * @returns {number} Delay with offset
 */
export function staggerDelayWithOffset(index, stepMs = 50, offsetMs = 0) {
  return offsetMs + (index * stepMs);
}

/**
 * D1-06: Keyframe generator for fade in animation
 * @param {string} fromOpacity - Starting opacity (default: '0')
 * @param {string} toOpacity - Ending opacity (default: '1')
 * @returns {string} CSS keyframes
 */
export function generateFadeInKeyframes(fromOpacity = '0', toOpacity = '1') {
  return `
    @keyframes fadeIn {
      from { opacity: ${fromOpacity}; }
      to { opacity: ${toOpacity}; }
    }
  `;
}

/**
 * D1-07: Keyframe generator for fade out animation
 */
export function generateFadeOutKeyframes(fromOpacity = '1', toOpacity = '0') {
  return `
    @keyframes fadeOut {
      from { opacity: ${fromOpacity}; }
      to { opacity: ${toOpacity}; }
    }
  `;
}

/**
 * D1-08: Keyframe generator for slide in from left
 */
export function generateSlideInLeftKeyframes(distance = '30px') {
  return `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-${distance});
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
}

/**
 * D1-09: Keyframe generator for slide in from right
 */
export function generateSlideInRightKeyframes(distance = '30px') {
  return `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(${distance});
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
}

/**
 * D1-10: Keyframe generator for slide in from top
 */
export function generateSlideInTopKeyframes(distance = '30px') {
  return `
    @keyframes slideInTop {
      from {
        opacity: 0;
        transform: translateY(-${distance});
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
}

/**
 * D1-11: Keyframe generator for slide in from bottom
 */
export function generateSlideInBottomKeyframes(distance = '30px') {
  return `
    @keyframes slideInBottom {
      from {
        opacity: 0;
        transform: translateY(${distance});
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
}

/**
 * D1-12: Keyframe generator for zoom in (scale) animation
 */
export function generateZoomInKeyframes(fromScale = '0.8', toScale = '1') {
  return `
    @keyframes zoomIn {
      from {
        opacity: 0;
        transform: scale(${fromScale});
      }
      to {
        opacity: 1;
        transform: scale(${toScale});
      }
    }
  `;
}

/**
 * D1-13: Keyframe generator for zoom out (scale down) animation
 */
export function generateZoomOutKeyframes(fromScale = '1', toScale = '0.8') {
  return `
    @keyframes zoomOut {
      from {
        opacity: 1;
        transform: scale(${fromScale});
      }
      to {
        opacity: 0;
        transform: scale(${toScale});
      }
    }
  `;
}

/**
 * D1-14: Keyframe generator for bounce animation
 */
export function generateBounceKeyframes(height = '30px') {
  return `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-${height}); }
    }
  `;
}

/**
 * D1-15: Keyframe generator for pulse animation
 */
export function generatePulseKeyframes() {
  return `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
}

/**
 * D1-16: Keyframe generator for spin/rotate animation
 */
export function generateSpinKeyframes(fromDeg = 0, toDeg = 360) {
  return `
    @keyframes spin {
      from { transform: rotate(${fromDeg}deg); }
      to { transform: rotate(${toDeg}deg); }
    }
  `;
}

/**
 * D1-17: Keyframe generator for scale pulse animation
 */
export function generateScalePulseKeyframes(minScale = '0.95', maxScale = '1') {
  return `
    @keyframes scalePulse {
      0%, 100% { transform: scale(${minScale}); }
      50% { transform: scale(${maxScale}); }
    }
  `;
}

/**
 * D1-18: Create CSS animation style string
 * @param {string} animationName - Name of the animation
 * @param {number} durationMs - Duration in milliseconds
 * @param {string} easing - Easing function
 * @param {number} delayMs - Delay in milliseconds
 * @param {string} fillMode - fill-mode (forwards, backwards, both)
 * @returns {object} Animation styles object
 */
export function createAnimationStyle(
  animationName,
  durationMs = 300,
  easing = MOTION_TOKENS.easing.easeInOut,
  delayMs = 0,
  fillMode = 'forwards'
) {
  const safeDuration = getSafeDuration(durationMs);
  const safeDelay = getSafeDelay(delayMs);

  return {
    animation: `${animationName} ${safeDuration}ms ${easing} ${safeDelay}ms ${fillMode}`,
  };
}

/**
 * D1-19: Create transition style string
 * @param {string} property - CSS property to transition
 * @param {number} durationMs - Duration in milliseconds
 * @param {string} easing - Easing function
 * @param {number} delayMs - Delay in milliseconds
 * @returns {object} Transition styles object
 */
export function createTransitionStyle(
  property = 'all',
  durationMs = 300,
  easing = MOTION_TOKENS.easing.easeInOut,
  delayMs = 0
) {
  const safeDuration = getSafeDuration(durationMs);
  const safeDelay = getSafeDelay(delayMs);

  return {
    transition: `${property} ${safeDuration}ms ${easing} ${safeDelay}ms`,
  };
}

/**
 * D1-20: Create staggered animation styles for multiple elements
 * @param {number} count - Number of elements to stagger
 * @param {string} animationName - Name of animation
 * @param {number} durationMs - Animation duration
 * @param {number} stepMs - Delay between items
 * @param {string} easing - Easing function
 * @returns {array} Array of style objects, one per item
 */
export function createStaggeredAnimationStyles(
  count,
  animationName,
  durationMs = 300,
  stepMs = 50,
  easing = MOTION_TOKENS.easing.easeInOut
) {
  const styles = [];

  for (let i = 0; i < count; i++) {
    const delay = staggerDelay(i, stepMs);
    const safeDelay = getSafeDelay(delay);
    const safeDuration = getSafeDuration(durationMs);

    styles.push({
      animation: `${animationName} ${safeDuration}ms ${easing} ${safeDelay}ms forwards`,
    });
  }

  return styles;
}

/**
 * Parallax scroll effect calculator
 * D2+ sprints will use this for ParallaxLayer component
 */
export function calculateParallaxOffset(scrollY, speed = 0.5) {
  return scrollY * speed;
}

/**
 * Get animation performance properties for 60fps
 * Returns will-change and other perf hints
 */
export function getPerformanceHints(properties = ['transform', 'opacity']) {
  return {
    willChange: properties.join(', '),
    backfaceVisibility: 'hidden',
    perspective: '1000px',
  };
}

export default {
  MOTION_TOKENS,
  prefersReducedMotion,
  getSafeDuration,
  getSafeDelay,
  staggerDelay,
  staggerDelayWithOffset,
  generateFadeInKeyframes,
  generateFadeOutKeyframes,
  generateSlideInLeftKeyframes,
  generateSlideInRightKeyframes,
  generateSlideInTopKeyframes,
  generateSlideInBottomKeyframes,
  generateZoomInKeyframes,
  generateZoomOutKeyframes,
  generateBounceKeyframes,
  generatePulseKeyframes,
  generateSpinKeyframes,
  generateScalePulseKeyframes,
  createAnimationStyle,
  createTransitionStyle,
  createStaggeredAnimationStyles,
  calculateParallaxOffset,
  getPerformanceHints,
};
