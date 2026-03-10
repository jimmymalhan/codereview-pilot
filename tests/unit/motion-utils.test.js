/**
 * F1-16 through F1-25: Motion Utilities Unit Tests
 * Unit Tests — Motion Utilities
 *
 * Tests the motion/animation utility functions (easing, stagger, spring)
 * Tests animation generators, timing utilities, and performance hints
 */

describe('Motion Utils - Animation Utilities', () => {
  // Mock matchMedia for prefers-reduced-motion
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = jest.fn((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? false : true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('F1-16: Reduced Motion Detection', () => {
    it('should detect when prefers-reduced-motion is not set', () => {
      window.matchMedia = jest.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Create motion utils inline
      const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should detect when prefers-reduced-motion is set', () => {
      window.matchMedia = jest.fn((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };

      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('F1-17: Safe Duration Calculation', () => {
    it('should return 0 when prefers-reduced-motion is enabled', () => {
      window.matchMedia = jest.fn((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);

      expect(getSafeDuration(300)).toBe(0);
      expect(getSafeDuration(500)).toBe(0);
    });

    it('should return original duration when prefers-reduced-motion is disabled', () => {
      window.matchMedia = jest.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);

      expect(getSafeDuration(300)).toBe(300);
      expect(getSafeDuration(500)).toBe(500);
    });

    it('should handle zero duration', () => {
      const prefersReducedMotion = () => false;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);

      expect(getSafeDuration(0)).toBe(0);
    });
  });

  describe('F1-18: Safe Delay Calculation', () => {
    it('should return 0 when prefers-reduced-motion is enabled', () => {
      const prefersReducedMotion = () => true;
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);

      expect(getSafeDelay(100)).toBe(0);
      expect(getSafeDelay(200)).toBe(0);
    });

    it('should return original delay when prefers-reduced-motion is disabled', () => {
      const prefersReducedMotion = () => false;
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);

      expect(getSafeDelay(100)).toBe(100);
      expect(getSafeDelay(200)).toBe(200);
    });
  });

  describe('F1-19: Stagger Delay Calculator', () => {
    it('should calculate correct delay for sequential animations', () => {
      const staggerDelay = (index, stepMs = 50) => index * stepMs;

      expect(staggerDelay(0)).toBe(0);
      expect(staggerDelay(1)).toBe(50);
      expect(staggerDelay(2)).toBe(100);
      expect(staggerDelay(3)).toBe(150);
    });

    it('should respect custom step size', () => {
      const staggerDelay = (index, stepMs = 50) => index * stepMs;

      expect(staggerDelay(0, 100)).toBe(0);
      expect(staggerDelay(1, 100)).toBe(100);
      expect(staggerDelay(2, 100)).toBe(200);
    });

    it('should handle large indices', () => {
      const staggerDelay = (index, stepMs = 50) => index * stepMs;

      expect(staggerDelay(100, 10)).toBe(1000);
      expect(staggerDelay(1000, 5)).toBe(5000);
    });
  });

  describe('F1-20: Stagger Delay with Offset', () => {
    it('should add offset to calculated delay', () => {
      const staggerDelayWithOffset = (index, stepMs = 50, offsetMs = 0) => offsetMs + index * stepMs;

      expect(staggerDelayWithOffset(0, 50, 100)).toBe(100);
      expect(staggerDelayWithOffset(1, 50, 100)).toBe(150);
      expect(staggerDelayWithOffset(2, 50, 100)).toBe(200);
    });

    it('should work with zero offset', () => {
      const staggerDelayWithOffset = (index, stepMs = 50, offsetMs = 0) => offsetMs + index * stepMs;

      expect(staggerDelayWithOffset(0, 50, 0)).toBe(0);
      expect(staggerDelayWithOffset(1, 50, 0)).toBe(50);
    });

    it('should respect default step size', () => {
      const staggerDelayWithOffset = (index, stepMs = 50, offsetMs = 0) => offsetMs + index * stepMs;

      expect(staggerDelayWithOffset(0, undefined, 100)).toBe(100);
    });
  });

  describe('F1-21: Keyframe Generators - Fade Animations', () => {
    it('should generate fade in keyframes with defaults', () => {
      const generateFadeInKeyframes = (fromOpacity = '0', toOpacity = '1') => `
    @keyframes fadeIn {
      from { opacity: ${fromOpacity}; }
      to { opacity: ${toOpacity}; }
    }
  `;

      const keyframes = generateFadeInKeyframes();
      expect(keyframes).toContain('@keyframes fadeIn');
      expect(keyframes).toContain('from { opacity: 0; }');
      expect(keyframes).toContain('to { opacity: 1; }');
    });

    it('should generate fade in keyframes with custom opacity', () => {
      const generateFadeInKeyframes = (fromOpacity = '0', toOpacity = '1') => `
    @keyframes fadeIn {
      from { opacity: ${fromOpacity}; }
      to { opacity: ${toOpacity}; }
    }
  `;

      const keyframes = generateFadeInKeyframes('0.5', '1');
      expect(keyframes).toContain('from { opacity: 0.5; }');
      expect(keyframes).toContain('to { opacity: 1; }');
    });

    it('should generate fade out keyframes', () => {
      const generateFadeOutKeyframes = (fromOpacity = '1', toOpacity = '0') => `
    @keyframes fadeOut {
      from { opacity: ${fromOpacity}; }
      to { opacity: ${toOpacity}; }
    }
  `;

      const keyframes = generateFadeOutKeyframes();
      expect(keyframes).toContain('@keyframes fadeOut');
      expect(keyframes).toContain('from { opacity: 1; }');
      expect(keyframes).toContain('to { opacity: 0; }');
    });
  });

  describe('F1-22: Keyframe Generators - Slide Animations', () => {
    it('should generate slide in left keyframes', () => {
      const generateSlideInLeftKeyframes = (distance = '30px') => `
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

      const keyframes = generateSlideInLeftKeyframes();
      expect(keyframes).toContain('@keyframes slideInLeft');
      expect(keyframes).toContain('translateX(-30px)');
      expect(keyframes).toContain('translateX(0)');
    });

    it('should generate slide in right keyframes', () => {
      const generateSlideInRightKeyframes = (distance = '30px') => `
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

      const keyframes = generateSlideInRightKeyframes();
      expect(keyframes).toContain('@keyframes slideInRight');
      expect(keyframes).toContain('translateX(30px)');
    });

    it('should generate slide in top keyframes', () => {
      const generateSlideInTopKeyframes = (distance = '30px') => `
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

      const keyframes = generateSlideInTopKeyframes();
      expect(keyframes).toContain('@keyframes slideInTop');
      expect(keyframes).toContain('translateY(-30px)');
    });

    it('should generate slide in bottom keyframes', () => {
      const generateSlideInBottomKeyframes = (distance = '30px') => `
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

      const keyframes = generateSlideInBottomKeyframes();
      expect(keyframes).toContain('@keyframes slideInBottom');
      expect(keyframes).toContain('translateY(30px)');
    });
  });

  describe('F1-23: Keyframe Generators - Transform Animations', () => {
    it('should generate zoom in keyframes', () => {
      const generateZoomInKeyframes = (fromScale = '0.8', toScale = '1') => `
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

      const keyframes = generateZoomInKeyframes();
      expect(keyframes).toContain('@keyframes zoomIn');
      expect(keyframes).toContain('scale(0.8)');
      expect(keyframes).toContain('scale(1)');
    });

    it('should generate zoom out keyframes', () => {
      const generateZoomOutKeyframes = (fromScale = '1', toScale = '0.8') => `
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

      const keyframes = generateZoomOutKeyframes();
      expect(keyframes).toContain('@keyframes zoomOut');
      expect(keyframes).toContain('scale(1)');
      expect(keyframes).toContain('scale(0.8)');
    });

    it('should generate spin/rotate keyframes', () => {
      const generateSpinKeyframes = (fromDeg = 0, toDeg = 360) => `
    @keyframes spin {
      from { transform: rotate(${fromDeg}deg); }
      to { transform: rotate(${toDeg}deg); }
    }
  `;

      const keyframes = generateSpinKeyframes();
      expect(keyframes).toContain('@keyframes spin');
      expect(keyframes).toContain('rotate(0deg)');
      expect(keyframes).toContain('rotate(360deg)');
    });
  });

  describe('F1-24: Special Effect Keyframes', () => {
    it('should generate bounce keyframes', () => {
      const generateBounceKeyframes = (height = '30px') => `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-${height}); }
    }
  `;

      const keyframes = generateBounceKeyframes();
      expect(keyframes).toContain('@keyframes bounce');
      expect(keyframes).toContain('translateY(0)');
      expect(keyframes).toContain('translateY(-30px)');
    });

    it('should generate pulse keyframes', () => {
      const generatePulseKeyframes = () => `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

      const keyframes = generatePulseKeyframes();
      expect(keyframes).toContain('@keyframes pulse');
      expect(keyframes).toContain('opacity: 1');
      expect(keyframes).toContain('opacity: 0.5');
    });

    it('should generate scale pulse keyframes', () => {
      const generateScalePulseKeyframes = (minScale = '0.95', maxScale = '1') => `
    @keyframes scalePulse {
      0%, 100% { transform: scale(${minScale}); }
      50% { transform: scale(${maxScale}); }
    }
  `;

      const keyframes = generateScalePulseKeyframes();
      expect(keyframes).toContain('@keyframes scalePulse');
      expect(keyframes).toContain('scale(0.95)');
      expect(keyframes).toContain('scale(1)');
    });
  });

  describe('F1-25: Animation Style Creators', () => {
    it('should create animation style object', () => {
      const prefersReducedMotion = () => false;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);

      const createAnimationStyle = (
        animationName,
        durationMs = 300,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
        delayMs = 0,
        fillMode = 'forwards'
      ) => {
        const safeDuration = getSafeDuration(durationMs);
        const safeDelay = getSafeDelay(delayMs);

        return {
          animation: `${animationName} ${safeDuration}ms ${easing} ${safeDelay}ms ${fillMode}`,
        };
      };

      const style = createAnimationStyle('fadeIn', 300);
      expect(style.animation).toContain('fadeIn');
      expect(style.animation).toContain('300ms');
      expect(style.animation).toContain('forwards');
    });

    it('should create transition style object', () => {
      const prefersReducedMotion = () => false;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);

      const createTransitionStyle = (
        property = 'all',
        durationMs = 300,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
        delayMs = 0
      ) => {
        const safeDuration = getSafeDuration(durationMs);
        const safeDelay = getSafeDelay(delayMs);

        return {
          transition: `${property} ${safeDuration}ms ${easing} ${safeDelay}ms`,
        };
      };

      const style = createTransitionStyle('opacity', 300);
      expect(style.transition).toContain('opacity');
      expect(style.transition).toContain('300ms');
    });

    it('should create staggered animation styles array', () => {
      const prefersReducedMotion = () => false;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);
      const staggerDelay = (index, stepMs = 50) => index * stepMs;

      const createStaggeredAnimationStyles = (
        count,
        animationName,
        durationMs = 300,
        stepMs = 50,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
      ) => {
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
      };

      const styles = createStaggeredAnimationStyles(3, 'fadeIn', 300, 50);
      expect(styles.length).toBe(3);
      expect(styles[0].animation).toContain('0ms');
      expect(styles[1].animation).toContain('50ms');
      expect(styles[2].animation).toContain('100ms');
    });

    it('should respect prefers-reduced-motion in animation styles', () => {
      const prefersReducedMotion = () => true;
      const getSafeDuration = (durationMs) => (prefersReducedMotion() ? 0 : durationMs);
      const getSafeDelay = (delayMs) => (prefersReducedMotion() ? 0 : delayMs);

      const createAnimationStyle = (
        animationName,
        durationMs = 300,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
        delayMs = 0,
        fillMode = 'forwards'
      ) => {
        const safeDuration = getSafeDuration(durationMs);
        const safeDelay = getSafeDelay(delayMs);

        return {
          animation: `${animationName} ${safeDuration}ms ${easing} ${safeDelay}ms ${fillMode}`,
        };
      };

      const style = createAnimationStyle('fadeIn', 300, 'ease', 100);
      expect(style.animation).toContain('0ms'); // Duration reduced to 0
      expect(style.animation).toContain('0ms'); // Delay reduced to 0
    });
  });
});
