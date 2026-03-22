/**
 * Accessibility Utilities v2
 * WCAG 2.1 AA Compliant Helpers
 *
 * @description Comprehensive accessibility utilities for inclusive web development
 * @version 2.0.0
 * @author ACCESSIBILITY_CHAMPION (Chris Lee)
 */

// ==================== Focus Management ====================

/**
 * Focus trap for modal dialogs
 * Prevents focus from escaping the modal
 */
export function createFocusTrap(element: HTMLElement): () => void {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details > summary',
    'audio[controls]',
    'video[controls]',
    'area[href]',
  ].join(',');

  const focusableElements = Array.from(
    element.querySelectorAll(focusableSelector)
  ) as HTMLElement[];

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  element.addEventListener("keydown", handleKeyDown);

  // Focus first element
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Focus an element with retry logic for async content
 */
export function focusWithRetry(
  element: HTMLElement | null,
  maxRetries = 5,
  delay = 50,
): Promise<boolean> {
  return new Promise((resolve) => {
    let retries = 0;

    function attemptFocus() {
      if (!element) {
        resolve(false);
        return;
      }

      if (element.offsetParent !== null || retries >= maxRetries) {
        element.focus();
        resolve(true);
        return;
      }

      retries++;
      setTimeout(attemptFocus, delay);
    }

    attemptFocus();
  });
}

/**
 * Restore focus to previous element
 * Useful for modals and popovers
 */
export function createFocusRestore(): {
  save: () => void;
  restore: () => void;
} {
  let previouslyFocusedElement: HTMLElement | null = null;

  return {
    save: () => {
      previouslyFocusedElement = document.activeElement as HTMLElement;
    },
    restore: () => {
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    },
  };
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  if (element.tabIndex < 0) {
    return false;
  }

  if (element.offsetParent === null && element.style.position !== "fixed") {
    return false;
  }

  return true;
}

// ==================== Screen Reader Support ====================

/**
 * Announce message to screen readers
 * Uses live region for dynamic announcements
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  const existingAnnouncer = document.getElementById("a11y-announcer");
  if (existingAnnouncer) {
    existingAnnouncer.remove();
  }

  const announcer = document.createElement("div");
  announcer.id = "a11y-announcer";
  announcer.className = "sr-only";
  announcer.setAttribute("aria-live", priority);
  announcer.setAttribute("aria-atomic", "true");
  announcer.setAttribute("role", "status");
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Clean up after announcement
  setTimeout(() => {
    announcer.remove();
  }, 1000);
}

/**
 * Create screen reader only text
 */
export function createSROnlyText(text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "sr-only";
  span.textContent = text;
  return span;
}

/**
 * Add aria-describedby to element
 */
export function addAriaDescription(
  element: HTMLElement,
  descriptionId: string,
): void {
  const existing = element.getAttribute("aria-describedby");
  if (existing) {
    element.setAttribute("aria-describedby", `${existing} ${descriptionId}`);
  } else {
    element.setAttribute("aria-describedby", descriptionId);
  }
}

/**
 * Set aria-label with unique ID
 */
export function setAccessibleName(element: HTMLElement, name: string): void {
  element.setAttribute("aria-label", name);
}

// ==================== Keyboard Navigation ====================

/**
 * Keyboard navigation key codes
 */
export const KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
  TAB: "Tab",
} as const;

/**
 * Create roving tabindex for composite widgets
 * (tabs, menu bars, toolbars, etc.)
 */
export function createRovingTabIndex(
  container: HTMLElement,
  itemSelector: string,
  options: {
    horizontal?: boolean;
    vertical?: boolean;
    wrap?: boolean;
    onSelect?: (item: HTMLElement, index: number) => void;
  } = {},
): {
  destroy: () => void;
  setActiveIndex: (index: number) => void;
  getActiveIndex: () => number;
} {
  const items = Array.from(
    container.querySelectorAll(itemSelector),
  ) as HTMLElement[];
  let activeIndex = 0;

  const { horizontal = true, vertical = true, wrap = true, onSelect } = options;

  function updateTabIndexes() {
    items.forEach((item, index) => {
      item.setAttribute("tabindex", index === activeIndex ? "0" : "-1");
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    let newIndex = activeIndex;
    let handled = false;

    switch (event.key) {
      case KEYS.ARROW_UP:
        if (vertical) {
          newIndex = wrap
            ? (activeIndex - 1 + items.length) % items.length
            : Math.max(0, activeIndex - 1);
          handled = true;
        }
        break;
      case KEYS.ARROW_DOWN:
        if (vertical) {
          newIndex = wrap
            ? (activeIndex + 1) % items.length
            : Math.min(items.length - 1, activeIndex + 1);
          handled = true;
        }
        break;
      case KEYS.ARROW_LEFT:
        if (horizontal) {
          newIndex = wrap
            ? (activeIndex - 1 + items.length) % items.length
            : Math.max(0, activeIndex - 1);
          handled = true;
        }
        break;
      case KEYS.ARROW_RIGHT:
        if (horizontal) {
          newIndex = wrap
            ? (activeIndex + 1) % items.length
            : Math.min(items.length - 1, activeIndex + 1);
          handled = true;
        }
        break;
      case KEYS.HOME:
        newIndex = 0;
        handled = true;
        break;
      case KEYS.END:
        newIndex = items.length - 1;
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
      if (newIndex !== activeIndex) {
        activeIndex = newIndex;
        updateTabIndexes();
        items[activeIndex].focus();
        onSelect?.(items[activeIndex], activeIndex);
      }
    }
  }

  container.addEventListener("keydown", handleKeyDown);
  updateTabIndexes();

  return {
    destroy: () => {
      container.removeEventListener("keydown", handleKeyDown);
    },
    setActiveIndex: (index: number) => {
      if (index >= 0 && index < items.length) {
        activeIndex = index;
        updateTabIndexes();
        items[activeIndex].focus();
        onSelect?.(items[activeIndex], activeIndex);
      }
    },
    getActiveIndex: () => activeIndex,
  };
}

/**
 * Create keyboard shortcut handler
 */
export function createKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
): () => void {
  function handleKeyDown(event: KeyboardEvent) {
    const key = [
      event.ctrlKey ? "ctrl+" : "",
      event.altKey ? "alt+" : "",
      event.shiftKey ? "shift+" : "",
      event.metaKey ? "meta+" : "",
      event.key.toLowerCase(),
    ]
      .filter(Boolean)
      .join("");

    const handler = shortcuts[key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}

// ==================== Color Contrast ====================

/**
 * Calculate relative luminance
 * WCAG 2.1 formula
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio (e.g., 4.5 for 4.5:1)
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA requirements
 */
export function meetsWCAGAA(
  contrastRatio: number,
  isLargeText = false,
): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA requirements
 */
export function meetsWCAGAAA(
  contrastRatio: number,
  isLargeText = false,
): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ==================== Touch Target ====================

/**
 * Check if element meets minimum touch target size (44x44 CSS pixels)
 * WCAG 2.5.5 Target Size (Enhanced)
 */
export function hasMinimumTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Ensure minimum touch target size
 */
export function ensureTouchTarget(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  if (rect.width < 44 || rect.height < 44) {
    element.style.minWidth = "44px";
    element.style.minHeight = "44px";
  }
}

// ==================== Reduced Motion ====================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apply animation only if motion is allowed
 */
export function applyAnimation(
  element: HTMLElement,
  animation: () => void,
): void {
  if (!prefersReducedMotion()) {
    animation();
  }
}

/**
 * Create reduced motion listener
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void,
): () => void {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener("change", handler);
  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
}

// ==================== ARIA Helpers ====================

/**
 * Set aria-expanded
 */
export function setExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute("aria-expanded", String(expanded));
}

/**
 * Set aria-selected
 */
export function setSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute("aria-selected", String(selected));
}

/**
 * Set aria-checked
 */
export function setChecked(
  element: HTMLElement,
  checked: boolean | "mixed",
): void {
  element.setAttribute("aria-checked", String(checked));
}

/**
 * Set aria-pressed
 */
export function setPressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute("aria-pressed", String(pressed));
}

/**
 * Set aria-hidden
 */
export function setHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute("aria-hidden", String(hidden));
}

/**
 * Set aria-invalid
 */
export function setInvalid(element: HTMLElement, invalid: boolean): void {
  element.setAttribute("aria-invalid", String(invalid));
}

/**
 * Set aria-required
 */
export function setRequired(element: HTMLElement, required: boolean): void {
  element.setAttribute("aria-required", String(required));
}

/**
 * Create aria-labelledby attribute
 */
export function labelledBy(element: HTMLElement, ids: string[]): void {
  element.setAttribute("aria-labelledby", ids.join(" "));
}

/**
 * Create aria-describedby attribute
 */
export function describedBy(element: HTMLElement, ids: string[]): void {
  element.setAttribute("aria-describedby", ids.join(" "));
}

// ==================== Skip Links ====================

/**
 * Create skip link
 */
export function createSkipLink(
  targetId: string,
  text: string,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = `#${targetId}`;
  link.className = "skip-link";
  link.textContent = text;

  // Style to be hidden until focused
  Object.assign(link.style, {
    position: "absolute",
    top: "-40px",
    left: "0",
    background: "#000",
    color: "#fff",
    padding: "8px",
    zIndex: "9999",
    transition: "top 0.3s",
  });

  link.addEventListener("focus", () => {
    link.style.top = "0";
  });

  link.addEventListener("blur", () => {
    link.style.top = "-40px";
  });

  return link;
}

/**
 * Initialize skip links for page
 */
export function initializeSkipLinks(
  links: Array<{ targetId: string; text: string }>,
): void {
  const container = document.createElement("nav");
  container.className = "skip-links";
  container.setAttribute("aria-label", "Skip links");

  links.forEach(({ targetId, text }) => {
    const link = createSkipLink(targetId, text);
    container.appendChild(link);
  });

  document.body.insertBefore(container, document.body.firstChild);
}

// ==================== Language & Reading ====================

/**
 * Set document language
 */
export function setDocumentLanguage(lang: string): void {
  document.documentElement.setAttribute("lang", lang);
}

/**
 * Set text direction
 */
export function setTextDirection(dir: "ltr" | "rtl" | "auto"): void {
  document.documentElement.setAttribute("dir", dir);
}

// ==================== High Contrast ====================

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia("(prefers-contrast: high)").matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// ==================== Export All ====================

export default {
  // Focus Management
  createFocusTrap,
  focusWithRetry,
  createFocusRestore,
  isFocusable,

  // Screen Reader Support
  announceToScreenReader,
  createSROnlyText,
  addAriaDescription,
  setAccessibleName,

  // Keyboard Navigation
  KEYS,
  createRovingTabIndex,
  createKeyboardShortcuts,

  // Color Contrast
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  hexToRgb,

  // Touch Target
  hasMinimumTouchTarget,
  ensureTouchTarget,

  // Reduced Motion
  prefersReducedMotion,
  applyAnimation,
  onReducedMotionChange,

  // ARIA Helpers
  setExpanded,
  setSelected,
  setChecked,
  setPressed,
  setHidden,
  setInvalid,
  setRequired,
  labelledBy,
  describedBy,

  // Skip Links
  createSkipLink,
  initializeSkipLinks,

  // Language & Reading
  setDocumentLanguage,
  setTextDirection,

  // High Contrast
  prefersHighContrast,
  prefersDarkMode,
};
