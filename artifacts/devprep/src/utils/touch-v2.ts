/**
 * RESPONSIVE_EXPERT (Nina Patel) - Touch Optimization Utilities v2.0
 * Created: 2026-03-22
 * Experience: 18 years in mobile-first and adaptive design
 * 
 * Comprehensive touch optimization system for mobile devices:
 * 1. Touch target validation (44px minimum)
 * 2. Touch event handling with passive listeners
 * 3. Gesture detection (swipe, pinch, tap)
 * 4. Haptic feedback integration
 * 5. Touch-friendly UI utilities
 */

// ============================================================================
// Types
// ============================================================================

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export interface TouchConfig {
  minTouchTarget: number;
  tapDelay: number;
  swipeThreshold: number;
  swipeVelocityThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
}

export type TouchEventHandler = (event: TouchEvent) => void;
export type SwipeHandler = (direction: SwipeDirection) => void;
export type TapHandler = (point: TouchPoint) => void;
export type LongPressHandler = (point: TouchPoint) => void;

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  minTouchTarget: 44, // WCAG 2.1 minimum
  tapDelay: 100,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  longPressDelay: 500,
  doubleTapDelay: 300,
};

// ============================================================================
// Touch Target Validation
// ============================================================================

/**
 * Validates if element meets minimum touch target size (44px)
 */
export function validateTouchTarget(element: HTMLElement): {
  isValid: boolean;
  width: number;
  height: number;
  suggestions: string[];
} {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  const width = rect.width;
  const height = rect.height;
  const suggestions: string[] = [];
  
  const isValid = width >= DEFAULT_TOUCH_CONFIG.minTouchTarget && 
                  height >= DEFAULT_TOUCH_CONFIG.minTouchTarget;
  
  if (width < DEFAULT_TOUCH_CONFIG.minTouchTarget) {
    suggestions.push(`Width ${width.toFixed(1)}px is below minimum ${DEFAULT_TOUCH_CONFIG.minTouchTarget}px`);
  }
  
  if (height < DEFAULT_TOUCH_CONFIG.minTouchTarget) {
    suggestions.push(`Height ${height.toFixed(1)}px is below minimum ${DEFAULT_TOUCH_CONFIG.minTouchTarget}px`);
  }
  
  // Check for adequate padding
  const paddingLeft = parseFloat(computedStyle.paddingLeft);
  const paddingRight = parseFloat(computedStyle.paddingRight);
  const paddingTop = parseFloat(computedStyle.paddingTop);
  const paddingBottom = parseFloat(computedStyle.paddingBottom);
  
  if (paddingLeft < 8 || paddingRight < 8) {
    suggestions.push('Consider adding more horizontal padding for touch targets');
  }
  
  if (paddingTop < 8 || paddingBottom < 8) {
    suggestions.push('Consider adding more vertical padding for touch targets');
  }
  
  return {
    isValid,
    width,
    height,
    suggestions,
  };
}

/**
 * Ensures element meets minimum touch target size
 */
export function enforceTouchTarget(
  element: HTMLElement,
  minSize: number = DEFAULT_TOUCH_CONFIG.minTouchTarget
): void {
  const rect = element.getBoundingClientRect();
  
  if (rect.width < minSize) {
    element.style.minWidth = `${minSize}px`;
  }
  
  if (rect.height < minSize) {
    element.style.minHeight = `${minSize}px`;
  }
  
  // Add touch-action for better mobile performance
  element.style.touchAction = 'manipulation';
}

/**
 * Creates a touch target wrapper for small elements
 */
export function createTouchTargetWrapper(
  element: HTMLElement,
  minSize: number = DEFAULT_TOUCH_CONFIG.minTouchTarget
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.minWidth = `${minSize}px`;
  wrapper.style.minHeight = `${minSize}px`;
  wrapper.style.touchAction = 'manipulation';
  
  element.parentNode?.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  
  return wrapper;
}

// ============================================================================
// Touch Event Handling
// ============================================================================

/**
 * Adds passive touch event listener for better performance
 */
export function addPassiveTouchEventListener(
  element: HTMLElement,
  eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  handler: TouchEventHandler,
  options?: AddEventListenerOptions
): () => void {
  const listenerOptions: AddEventListenerOptions = {
    passive: true,
    ...options,
  };
  
  element.addEventListener(eventType, handler, listenerOptions);
  
  return () => {
    element.removeEventListener(eventType, handler, listenerOptions);
  };
}

/**
 * Prevents default touch behavior (e.g., scrolling) on specific elements
 */
export function preventTouchScroll(element: HTMLElement): () => void {
  const preventHandler = (e: TouchEvent) => {
    e.preventDefault();
  };
  
  element.addEventListener('touchmove', preventHandler, { passive: false });
  
  return () => {
    element.removeEventListener('touchmove', preventHandler);
  };
}

// ============================================================================
// Gesture Detection
// ============================================================================

/**
 * Detects swipe gestures
 */
export function createSwipeDetector(
  element: HTMLElement,
  handler: SwipeHandler,
  config: Partial<TouchConfig> = {}
): () => void {
  const { swipeThreshold, swipeVelocityThreshold } = {
    ...DEFAULT_TOUCH_CONFIG,
    ...config,
  };
  
  let startPoint: TouchPoint | null = null;
  let startTime: number = 0;
  
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    startTime = Date.now();
  };
  
  const onTouchEnd = (e: TouchEvent) => {
    if (!startPoint) return;
    
    const touch = e.changedTouches[0];
    const endPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const deltaTime = endPoint.timestamp - startPoint.timestamp;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Check if movement exceeds threshold
    if (Math.max(absX, absY) < swipeThreshold) {
      startPoint = null;
      return;
    }
    
    // Calculate velocity
    const velocity = Math.max(absX, absY) / deltaTime;
    
    if (velocity < swipeVelocityThreshold) {
      startPoint = null;
      return;
    }
    
    // Determine direction
    let direction: SwipeDirection['direction'];
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    handler({
      direction,
      deltaX,
      deltaY,
      velocity,
    });
    
    startPoint = null;
  };
  
  const onTouchCancel = () => {
    startPoint = null;
  };
  
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchCancel, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
  };
}

/**
 * Detects tap gestures
 */
export function createTapDetector(
  element: HTMLElement,
  handler: TapHandler,
  config: Partial<TouchConfig> = {}
): () => void {
  const { tapDelay } = { ...DEFAULT_TOUCH_CONFIG, ...config };
  
  let startPoint: TouchPoint | null = null;
  let tapTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
  };
  
  const onTouchEnd = (e: TouchEvent) => {
    if (!startPoint) return;
    
    const touch = e.changedTouches[0];
    const endPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    
    const deltaX = Math.abs(endPoint.x - startPoint.x);
    const deltaY = Math.abs(endPoint.y - startPoint.y);
    
    // Check if movement is minimal (tap, not swipe)
    if (deltaX < 10 && deltaY < 10) {
      if (tapTimeout) clearTimeout(tapTimeout);
      
      tapTimeout = setTimeout(() => {
        handler(startPoint!);
        startPoint = null;
      }, tapDelay);
    } else {
      startPoint = null;
    }
  };
  
  const onTouchCancel = () => {
    if (tapTimeout) clearTimeout(tapTimeout);
    startPoint = null;
  };
  
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchCancel, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
    if (tapTimeout) clearTimeout(tapTimeout);
  };
}

/**
 * Detects long press gestures
 */
export function createLongPressDetector(
  element: HTMLElement,
  handler: LongPressHandler,
  config: Partial<TouchConfig> = {}
): () => void {
  const { longPressDelay } = { ...DEFAULT_TOUCH_CONFIG, ...config };
  
  let startPoint: TouchPoint | null = null;
  let longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;
  
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    isLongPress = false;
    
    longPressTimeout = setTimeout(() => {
      if (startPoint) {
        isLongPress = true;
        handler(startPoint);
      }
    }, longPressDelay);
  };
  
  const onTouchMove = (e: TouchEvent) => {
    if (!startPoint || !longPressTimeout) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startPoint.x);
    const deltaY = Math.abs(touch.clientY - startPoint.y);
    
    // Cancel long press if finger moves too much
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimeout);
      longPressTimeout = null;
    }
  };
  
  const onTouchEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      longPressTimeout = null;
    }
    startPoint = null;
    isLongPress = false;
  };
  
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchEnd, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchEnd);
    if (longPressTimeout) clearTimeout(longPressTimeout);
  };
}

/**
 * Detects double tap gestures
 */
export function createDoubleTapDetector(
  element: HTMLElement,
  handler: TapHandler,
  config: Partial<TouchConfig> = {}
): () => void {
  const { doubleTapDelay } = { ...DEFAULT_TOUCH_CONFIG, ...config };
  
  let lastTap: TouchPoint | null = null;
  let tapTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const currentPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    
    if (lastTap) {
      const deltaX = Math.abs(currentPoint.x - lastTap.x);
      const deltaY = Math.abs(currentPoint.y - lastTap.y);
      const deltaTime = currentPoint.timestamp - lastTap.timestamp;
      
      // Check if it's a double tap
      if (deltaX < 30 && deltaY < 30 && deltaTime < doubleTapDelay) {
        if (tapTimeout) clearTimeout(tapTimeout);
        handler(currentPoint);
        lastTap = null;
        return;
      }
    }
    
    lastTap = currentPoint;
    
    if (tapTimeout) clearTimeout(tapTimeout);
    tapTimeout = setTimeout(() => {
      lastTap = null;
    }, doubleTapDelay);
  };
  
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    if (tapTimeout) clearTimeout(tapTimeout);
  };
}

// ============================================================================
// Haptic Feedback
// ============================================================================

/**
 * Triggers haptic feedback on supported devices
 */
export function triggerHapticFeedback(
  style: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light'
): void {
  if (!('vibrate' in navigator)) {
    return;
  }
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    selection: 5,
    success: [10, 50, 10],
    warning: [25, 50, 25],
    error: [50, 100, 50, 100, 50],
  };
  
  const pattern = patterns[style];
  if (pattern) {
    navigator.vibrate(pattern);
  }
}

/**
 * Adds haptic feedback to element interactions
 */
export function addHapticFeedback(
  element: HTMLElement,
  style: 'light' | 'medium' | 'heavy' | 'selection' = 'light'
): () => void {
  const onTouchStart = () => {
    triggerHapticFeedback(style);
  };
  
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
  };
}

// ============================================================================
// Touch-Friendly UI Utilities
// ============================================================================

/**
 * Makes element touch-friendly with proper sizing and feedback
 */
export function makeTouchFriendly(
  element: HTMLElement,
  options: {
    minSize?: number;
    addFeedback?: boolean;
    addHaptic?: boolean;
    hapticStyle?: 'light' | 'medium' | 'heavy' | 'selection';
  } = {}
): () => void {
  const {
    minSize = DEFAULT_TOUCH_CONFIG.minTouchTarget,
    addFeedback = true,
    addHaptic = false,
    hapticStyle = 'light',
  } = options;
  
  // Enforce minimum size
  enforceTouchTarget(element, minSize);
  
  // Add touch feedback class
  if (addFeedback) {
    element.classList.add('touch-feedback');
  }
  
  // Add haptic feedback
  let cleanupHaptic: (() => void) | undefined;
  if (addHaptic) {
    cleanupHaptic = addHapticFeedback(element, hapticStyle);
  }
  
  return () => {
    if (cleanupHaptic) cleanupHaptic();
  };
}

/**
 * Creates touch-friendly button from any element
 */
export function createTouchButton(
  element: HTMLElement,
  onClick: () => void,
  options: {
    minSize?: number;
    addHaptic?: boolean;
  } = {}
): () => void {
  const { minSize = DEFAULT_TOUCH_CONFIG.minTouchTarget, addHaptic = false } = options;
  
  // Make element touch-friendly
  const cleanupTouch = makeTouchFriendly(element, {
    minSize,
    addFeedback: true,
    addHaptic,
  });
  
  // Add click handler
  const handleClick = () => {
    onClick();
  };
  
  element.addEventListener('click', handleClick);
  
  // Add keyboard accessibility
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    cleanupTouch();
    element.removeEventListener('click', handleClick);
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// ============================================================================
// Touch State Detection
// ============================================================================

/**
 * Detects if device supports touch
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detects if device is iOS
 */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detects if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Detects if device is mobile
 */
export function isMobile(): boolean {
  return isTouchDevice() && (isIOS() || isAndroid());
}

/**
 * Gets touch capability info
 */
export function getTouchInfo(): {
  isTouchDevice: boolean;
  maxTouchPoints: number;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  hasHover: boolean;
} {
  return {
    isTouchDevice: isTouchDevice(),
    maxTouchPoints: navigator.maxTouchPoints || 0,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMobile: isMobile(),
    hasHover: window.matchMedia('(hover: hover)').matches,
  };
}

// ============================================================================
// Export Utilities
// ============================================================================

export const touchUtils = {
  validateTouchTarget,
  enforceTouchTarget,
  createTouchTargetWrapper,
  addPassiveTouchEventListener,
  preventTouchScroll,
  createSwipeDetector,
  createTapDetector,
  createLongPressDetector,
  createDoubleTapDetector,
  triggerHapticFeedback,
  addHapticFeedback,
  makeTouchFriendly,
  createTouchButton,
  isTouchDevice,
  isIOS,
  isAndroid,
  isMobile,
  getTouchInfo,
  DEFAULT_TOUCH_CONFIG,
};