/**
 * Accessibility utility functions and constants for DevPrep UI
 * Implements WCAG 2.1 AA compliance helpers
 */

// ============================================================================
// ARIA Attributes Helpers
// ============================================================================

/**
 * Generates accessible name for interactive elements
 */
export function getAccessibleName(
  label: string,
  context?: string,
  additionalInfo?: string
): string {
  const parts = [label]
  if (context) parts.push(context)
  if (additionalInfo) parts.push(additionalInfo)
  return parts.join(' - ')
}

/**
 * Creates ARIA described-by IDs for complex components
 */
export function createAriaDescribedBy(mainId: string, ...descriptionIds: string[]): string {
  return [mainId, ...descriptionIds].filter(Boolean).join(' ')
}

/**
 * Returns appropriate ARIA live region attributes for announcements
 */
export function getAriaLiveAttributes(
  politeness: 'polite' | 'assertive' | 'off' = 'polite',
  atomic: boolean = true,
  relevant: string = 'additions text'
): {
  'aria-live': typeof politeness
  'aria-atomic': boolean
  'aria-relevant': string
} {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
  }
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

/**
 * Keyboard event keys for navigation
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * Checks if event key is a navigation key
 */
export function isNavigationKey(key: string): boolean {
  return Object.values(KEYS).includes(key as (typeof KEYS)[keyof typeof KEYS])
}

/**
 * Checks if event key is an activation key (Enter or Space)
 */
export function isActivationKey(key: string): boolean {
  return key === KEYS.ENTER || key === KEYS.SPACE
}

/**
 * Creates roving tabindex pattern for lists
 */
export function getRovingTabindex(
  currentIndex: number,
  totalItems: number,
  direction: 'next' | 'prev' | 'first' | 'last'
): number {
  switch (direction) {
    case 'next':
      return (currentIndex + 1) % totalItems
    case 'prev':
      return (currentIndex - 1 + totalItems) % totalItems
    case 'first':
      return 0
    case 'last':
      return totalItems - 1
    default:
      return currentIndex
  }
}

// ============================================================================
// Focus Management Helpers
// ============================================================================

/**
 * Traps focus within a container (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  const focusableElements = element.querySelectorAll(focusableSelectors)
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== KEYS.TAB) return

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Returns focus to a previous element
 */
export function returnFocus(previousElement: HTMLElement | null): void {
  if (previousElement && document.body.contains(previousElement)) {
    previousElement.focus()
  }
}

// ============================================================================
// Screen Reader Helpers
// ============================================================================

/**
 * Creates screen reader only text
 */
export function createScreenReaderText(text: string): string {
  return `<span class="sr-only">${text}</span>`
}

/**
 * Announces message to screen readers
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', politeness)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// ============================================================================
// Color Contrast Helpers (WCAG 2.1 AA)
// ============================================================================

/**
 * Calculates relative luminance for color contrast
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculates contrast ratio between two colors
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getRelativeLuminance(...color1)
  const lum2 = getRelativeLuminance(...color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Checks if contrast ratio meets WCAG 2.1 AA standards
 */
export function meetsWCAG_AA(contrastRatio: number, isLargeText: boolean = false): boolean {
  const minimumRatio = isLargeText ? 3 : 4.5
  return contrastRatio >= minimumRatio
}

/**
 * Checks if contrast ratio meets WCAG 2.1 AAA standards
 */
export function meetsWCAG_AAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  const minimumRatio = isLargeText ? 4.5 : 7
  return contrastRatio >= minimumRatio
}

// ============================================================================
// Touch Target Helpers (WCAG 2.1 AA - 44px minimum)
// ============================================================================

/**
 * Minimum touch target size (WCAG 2.1 AA)
 */
export const MIN_TOUCH_TARGET_SIZE = 44

/**
 * Checks if element meets minimum touch target size
 */
export function meetsTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE
}

/**
 * Ensures element has minimum touch target size
 */
export function ensureTouchTargetSize(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  if (rect.width < MIN_TOUCH_TARGET_SIZE || rect.height < MIN_TOUCH_TARGET_SIZE) {
    element.style.minWidth = `${MIN_TOUCH_TARGET_SIZE}px`
    element.style.minHeight = `${MIN_TOUCH_TARGET_SIZE}px`
  }
}

// ============================================================================
// Semantic HTML Helpers
// ============================================================================

/**
 * Creates proper heading hierarchy
 */
export function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6, text: string, id?: string): string {
  const headingId = id || `heading-${level}-${Math.random().toString(36).substr(2, 9)}`
  return `<h${level} id="${headingId}">${text}</h${level}>`
}

/**
 * Creates landmark regions
 */
export function createLandmark(role: string, label: string, content: string): string {
  return `<div role="${role}" aria-label="${label}">${content}</div>`
}

// ============================================================================
// Form Accessibility Helpers
// ============================================================================

/**
 * Creates accessible form field with label and description
 */
export function createAccessibleField(
  id: string,
  label: string,
  description?: string,
  required: boolean = false
): {
  labelId: string
  descriptionId: string
  required: boolean
} {
  return {
    labelId: `${id}-label`,
    descriptionId: description ? `${id}-description` : '',
    required,
  }
}

/**
 * Returns error message attributes for form validation
 */
export function getErrorAttributes(
  errorId: string,
  hasError: boolean
): {
  'aria-invalid': boolean
  'aria-errormessage': string
} {
  return {
    'aria-invalid': hasError,
    'aria-errormessage': hasError ? errorId : '',
  }
}

// ============================================================================
// Reduced Motion Support
// ============================================================================

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Applies motion preferences to element
 */
export function applyMotionPreferences(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    element.style.transitionDuration = '0.01ms !important'
    element.style.animationDuration = '0.01ms !important'
  }
}

// ============================================================================
// Accessibility Audit Helpers
// ============================================================================

/**
 * Common accessibility issues to check
 */
export const ACCESSIBILITY_CHECKS = {
  IMAGES: 'All images have alt text',
  LINKS: 'All links have descriptive text',
  BUTTONS: 'All buttons have accessible names',
  FORMS: 'All form inputs have labels',
  HEADINGS: 'Heading hierarchy is correct',
  ARIA: 'ARIA attributes are valid',
  COLOR: 'Color contrast meets WCAG AA',
  KEYBOARD: 'All interactive elements are keyboard accessible',
  FOCUS: 'Focus indicators are visible',
  TOUCH: 'Touch targets meet minimum size (44px)',
} as const

/**
 * Default focus ring styles
 */
export const FOCUS_RING_STYLES = {
  DEFAULT: 'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
  RING: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  GLASS: 'glass-focus:focus-visible:outline-2 glass-focus:focus-visible:outline-ring/50',
} as const

/**
 * Keyboard navigation patterns
 */
export const KEYBOARD_PATTERNS = {
  TAB: 'Tab through interactive elements',
  ARROW_KEYS: 'Navigate within composite widgets',
  ENTER_SPACE: 'Activate buttons and links',
  ESCAPE: 'Close modals and popups',
  HOME_END: 'Jump to first/last item in lists',
} as const
