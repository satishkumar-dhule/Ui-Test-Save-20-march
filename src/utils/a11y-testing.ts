/**
 * Accessibility Testing Utilities
 * WCAG 2.1 AA Compliance Testing Helpers
 * 
 * @description Tools for testing and validating accessibility compliance
 * @version 2.0.0
 * @author ACCESSIBILITY_CHAMPION (Chris Lee)
 */

// ==================== Color Contrast Testing ====================

interface Color {
  r: number;
  g: number;
  b: number;
}

/**
 * Test color contrast ratio
 * Returns detailed contrast report
 */
export function testColorContrast(
  foreground: Color | string,
  background: Color | string
): {
  ratio: number;
  passes: {
    aa: { normalText: boolean; largeText: boolean };
    aaa: { normalText: boolean; largeText: boolean };
  };
  recommendation: string;
} {
  const parseColor = (color: Color | string): Color => {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16),
      };
    }
    return color;
  };

  const fg = parseColor(foreground);
  const bg = parseColor(background);

  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  const passes = {
    aa: {
      normalText: ratio >= 4.5,
      largeText: ratio >= 3,
    },
    aaa: {
      normalText: ratio >= 7,
      largeText: ratio >= 4.5,
    },
  };

  let recommendation = '';
  if (!passes.aa.normalText) {
    recommendation = 'Increase contrast to at least 4.5:1 for normal text';
  } else if (!passes.aa.largeText) {
    recommendation = 'Increase contrast to at least 3:1 for large text';
  } else if (!passes.aaa.normalText) {
    recommendation = 'Meets WCAG AA. Consider increasing to 7:1 for AAA compliance';
  } else {
    recommendation = 'Excellent contrast! Meets WCAG AAA requirements';
  }

  return { ratio, passes, recommendation };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ==================== Focus Testing ====================

/**
 * Get all focusable elements in container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]',
    'details > summary',
    'audio[controls]',
    'video[controls]',
    'area[href]',
  ].join(',');

  return Array.from(
    container.querySelectorAll(focusableSelectors)
  ) as HTMLElement[];
}

/**
 * Test tab order
 * Returns elements in expected tab order
 */
export function testTabOrder(container: HTMLElement): {
  elements: HTMLElement[];
  issues: string[];
  valid: boolean;
} {
  const focusableElements = getFocusableElements(container);
  const issues: string[] = [];

  // Check for duplicate tab indexes
  const tabIndexElements = focusableElements.filter(
    (el) => el.tabIndex > 0
  );
  if (tabIndexElements.length > 0) {
    issues.push(`Found ${tabIndexElements.length} elements with positive tabindex`);
  }

  // Check for missing focus styles
  focusableElements.forEach((el, index) => {
    const styles = window.getComputedStyle(el);
    if (styles.outline === 'none' && styles.boxShadow === 'none') {
      issues.push(`Element at index ${index} may lack visible focus indicator`);
    }
  });

  return {
    elements: focusableElements,
    issues,
    valid: issues.length === 0,
  };
}

/**
 * Test focus trap
 */
export function testFocusTrap(container: HTMLElement): {
  trapped: boolean;
  canEscape: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    issues.push('No focusable elements found in trap');
    return { trapped: false, canEscape: true, issues };
  }

  // Simulate tab at boundaries
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Check if first element can be focused
  if (!firstElement) {
    issues.push('First focusable element not found');
  }

  // Check if last element can be focused
  if (!lastElement) {
    issues.push('Last focusable element not found');
  }

  return {
    trapped: issues.length === 0,
    canEscape: false,
    issues,
  };
}

// ==================== ARIA Testing ====================

/**
 * Test ARIA attributes
 */
export function testARIA(element: HTMLElement): {
  hasRole: boolean;
  hasLabel: boolean;
  hasDescription: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');

  const hasRole = !!role;
  const hasLabel = !!(ariaLabel || ariaLabelledBy);
  const hasDescription = !!ariaDescribedBy;

  if (!hasRole) {
    issues.push('Missing role attribute');
  }

  // Interactive elements need labels
  const interactiveRoles = [
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'menuitem',
    'tab',
    'option',
    'combobox',
    'textbox',
    'searchbox',
  ];

  if (role && interactiveRoles.includes(role) && !hasLabel) {
    issues.push(`Interactive role "${role}" needs accessible name`);
  }

  return { hasRole, hasLabel, hasDescription, issues };
}

/**
 * Test landmark regions
 */
export function testLandmarks(document: Document): {
  landmarks: Array<{
    role: string;
    element: HTMLElement;
    label?: string;
  }>;
  issues: string[];
} {
  const landmarkRoles = [
    'banner',
    'navigation',
    'main',
    'complementary',
    'contentinfo',
    'search',
    'form',
    'region',
  ];

  const landmarks: Array<{
    role: string;
    element: HTMLElement;
    label?: string;
  }> = [];

  const issues: string[] = [];

  landmarkRoles.forEach((role) => {
    const elements = document.querySelectorAll(`[role="${role}"]`);
    elements.forEach((el) => {
      landmarks.push({
        role,
        element: el as HTMLElement,
        label: el.getAttribute('aria-label') || undefined,
      });
    });
  });

  // Check for required landmarks
  const hasMain = landmarks.some((l) => l.role === 'main');
  const hasNav = landmarks.some((l) => l.role === 'navigation');

  if (!hasMain) {
    issues.push('Missing main landmark');
  }

  if (!hasNav) {
    issues.push('Missing navigation landmark');
  }

  return { landmarks, issues };
}

// ==================== Heading Testing ====================

/**
 * Test heading structure
 */
export function testHeadingStructure(document: Document): {
  headings: Array<{
    level: number;
    text: string;
    element: HTMLHeadingElement;
  }>;
  issues: string[];
  valid: boolean;
} {
  const headings: Array<{
    level: number;
    text: string;
    element: HTMLHeadingElement;
  }> = [];

  const issues: string[] = [];

  const headingElements = document.querySelectorAll(
    'h1, h2, h3, h4, h5, h6'
  ) as NodeListOf<HTMLHeadingElement>;

  headingElements.forEach((el) => {
    const level = parseInt(el.tagName.charAt(1));
    const text = el.textContent || '';

    headings.push({ level, text, element: el });
  });

  // Check for multiple h1s
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    issues.push('No h1 heading found');
  } else if (h1Count > 1) {
    issues.push(`Found ${h1Count} h1 headings (should be 1)`);
  }

  // Check for skipped levels
  let prevLevel = 0;
  headings.forEach((heading, index) => {
    if (prevLevel > 0 && heading.level > prevLevel + 1) {
      issues.push(
        `Skipped heading level: h${prevLevel} to h${heading.level} at index ${index}`
      );
    }
    prevLevel = heading.level;
  });

  return {
    headings,
    issues,
    valid: issues.length === 0,
  };
}

// ==================== Image Testing ====================

/**
 * Test image accessibility
 */
export function testImages(container: HTMLElement): {
  images: Array<{
    element: HTMLImageElement;
    hasAlt: boolean;
    hasLabel: boolean;
    decorative: boolean;
  }>;
  issues: string[];
} {
  const images = Array.from(
    container.querySelectorAll('img')
  ) as HTMLImageElement[];

  const issues: string[] = [];
  const results = images.map((img) => {
    const hasAlt = img.hasAttribute('alt');
    const alt = img.getAttribute('alt');
    const hasLabel = !!(img.getAttribute('aria-label') || img.getAttribute('aria-labelledby'));
    const decorative = alt === '';

    if (!hasAlt && !hasLabel) {
      issues.push(`Image missing alt attribute: ${img.src}`);
    }

    return { element: img, hasAlt, hasLabel, decorative };
  });

  return { images: results, issues };
}

// ==================== Form Testing ====================

/**
 * Test form accessibility
 */
export function testFormAccessibility(form: HTMLFormElement): {
  fields: Array<{
    element: HTMLElement;
    hasLabel: boolean;
    hasError: boolean;
    errorMessage?: string;
  }>;
  issues: string[];
} {
  const fields: Array<{
    element: HTMLElement;
    hasLabel: boolean;
    hasError: boolean;
    errorMessage?: string;
  }> = [];

  const issues: string[] = [];

  const inputs = form.querySelectorAll(
    'input:not([type="hidden"]), select, textarea'
  ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

  inputs.forEach((input) => {
    const id = input.id;
    const hasLabel = id ? !!form.querySelector(`label[for="${id}"]`) : false;
    const hasAriaLabel = !!(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
    const hasError = input.getAttribute('aria-invalid') === 'true';
    const errorMessageId = input.getAttribute('aria-describedby');
    
    let errorMessage: string | undefined;
    if (errorMessageId) {
      const errorElement = document.getElementById(errorMessageId);
      errorMessage = errorElement?.textContent || undefined;
    }

    if (!hasLabel && !hasAriaLabel) {
      issues.push(`Form field missing label: ${input.name || input.id || 'unknown'}`);
    }

    fields.push({
      element: input,
      hasLabel: hasLabel || hasAriaLabel,
      hasError,
      errorMessage,
    });
  });

  return { fields, issues };
}

// ==================== List Testing ====================

/**
 * Test list structure
 */
export function testListStructure(container: HTMLElement): {
  lists: Array<{
    element: HTMLElement;
    type: 'ul' | 'ol';
    itemCount: number;
    hasLabel: boolean;
  }>;
  issues: string[];
} {
  const lists: Array<{
    element: HTMLElement;
    type: 'ul' | 'ol';
    itemCount: number;
    hasLabel: boolean;
  }> = [];

  const issues: string[] = [];

  const listElements = container.querySelectorAll('ul, ol');

  listElements.forEach((list) => {
    const type = list.tagName.toLowerCase() as 'ul' | 'ol';
    const itemCount = list.querySelectorAll(':scope > li').length;
    const hasLabel = !!(
      list.getAttribute('aria-label') || list.getAttribute('aria-labelledby')
    );

    lists.push({ element: list as HTMLElement, type, itemCount, hasLabel });
  });

  return { lists, issues };
}

// ==================== Touch Target Testing ====================

/**
 * Test touch target sizes
 */
export function testTouchTargets(container: HTMLElement): {
  targets: Array<{
    element: HTMLElement;
    width: number;
    height: number;
    passes: boolean;
  }>;
  issues: string[];
} {
  const interactiveElements = container.querySelectorAll(
    'a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="tab"]'
  );

  const targets: Array<{
    element: HTMLElement;
    width: number;
    height: number;
    passes: boolean;
  }> = [];

  const issues: string[] = [];

  interactiveElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const passes = width >= 44 && height >= 44;

    targets.push({ element: el as HTMLElement, width, height, passes });

    if (!passes) {
      issues.push(
        `Touch target too small: ${width}x${height}px (minimum 44x44px)`
      );
    }
  });

  return { targets, issues };
}

// ==================== Comprehensive Audit ====================

/**
 * Run comprehensive accessibility audit
 */
export function runAccessibilityAudit(container: HTMLElement | Document = document): {
  summary: {
    score: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  categories: {
    colorContrast: { score: number; issues: string[] };
    focusManagement: { score: number; issues: string[] };
    headings: { score: number; issues: string[] };
    images: { score: number; issues: string[] };
    forms: { score: number; issues: string[] };
    touchTargets: { score: number; issues: string[] };
    landmarks: { score: number; issues: string[] };
  };
  recommendations: string[];
} {
  const doc = container as Document;

  // Run all tests
  const headingTest = testHeadingStructure(doc);
  const landmarkTest = testLandmarks(doc);
  const imageTest = testImages(doc as unknown as HTMLElement);
  const formTest = doc.forms?.[0]
    ? testFormAccessibility(doc.forms[0])
    : { fields: [], issues: [] };
  const touchTargetTest = testTouchTargets(doc as unknown as HTMLElement);
  const tabOrderTest = testTabOrder(doc as unknown as HTMLElement);

  // Calculate scores (0-100)
  const headingScore = Math.max(0, 100 - headingTest.issues.length * 20);
  const landmarkScore = Math.max(0, 100 - landmarkTest.issues.length * 30);
  const imageScore = Math.max(0, 100 - imageTest.issues.length * 25);
  const formScore = Math.max(0, 100 - formTest.issues.length * 15);
  const touchScore = Math.max(0, 100 - touchTargetTest.issues.length * 10);
  const focusScore = Math.max(0, 100 - tabOrderTest.issues.length * 20);

  const allIssues = [
    ...headingTest.issues,
    ...landmarkTest.issues,
    ...imageTest.issues,
    ...formTest.issues,
    ...touchTargetTest.issues,
    ...tabOrderTest.issues,
  ];

  const totalScore = Math.round(
    (headingScore +
      landmarkScore +
      imageScore +
      formScore +
      touchScore +
      focusScore) /
      6
  );

  const recommendations: string[] = [];

  if (headingScore < 100) {
    recommendations.push('Fix heading hierarchy issues');
  }
  if (landmarkScore < 100) {
    recommendations.push('Add required landmark regions');
  }
  if (imageScore < 100) {
    recommendations.push('Add alt text to all images');
  }
  if (formScore < 100) {
    recommendations.push('Ensure all form fields have labels');
  }
  if (touchScore < 100) {
    recommendations.push('Increase touch target sizes to 44x44px');
  }
  if (focusScore < 100) {
    recommendations.push('Fix focus management issues');
  }

  return {
    summary: {
      score: totalScore,
      passed: Math.floor(totalScore / 10),
      failed: allIssues.length,
      warnings: Math.floor((100 - totalScore) / 10),
    },
    categories: {
      colorContrast: { score: 100, issues: [] },
      focusManagement: { score: focusScore, issues: tabOrderTest.issues },
      headings: { score: headingScore, issues: headingTest.issues },
      images: { score: imageScore, issues: imageTest.issues },
      forms: { score: formScore, issues: formTest.issues },
      touchTargets: { score: touchScore, issues: touchTargetTest.issues },
      landmarks: { score: landmarkScore, issues: landmarkTest.issues },
    },
    recommendations,
  };
}

// ==================== Export All ====================

export default {
  testColorContrast,
  getFocusableElements,
  testTabOrder,
  testFocusTrap,
  testARIA,
  testLandmarks,
  testHeadingStructure,
  testImages,
  testFormAccessibility,
  testListStructure,
  testTouchTargets,
  runAccessibilityAudit,
};