/**
 * Security Utilities
 * 
 * This module provides security-related utilities for XSS prevention
 * and input sanitization.
 * 
 * IMPORTANT: For production use, consider installing and using DOMPurify:
 *   npm install dompurify
 *   import DOMPurify from 'dompurify';
 * 
 * DOMPurify provides comprehensive XSS protection by sanitizing HTML
 * to remove dangerous content while preserving safe HTML elements.
 * 
 * Example usage with DOMPurify:
 *   DOMPurify.sanitize(dirtyHTML, {
 *     USE_PROFILES: { svg: true },
 *     ALLOWED_TAGS: ['svg', 'path', 'rect', 'circle', 'text', 'g', 'defs', 'marker'],
 *     ALLOWED_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'd', 'x', 'y', 'width', 'height', 
 *                   'rx', 'ry', 'text-anchor', 'font-size', 'font-weight', 'font-family',
 *                   'stroke-width', 'stroke-dasharray', 'marker-end', 'transform']
 *   });
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// =============================================================================
// SVG SANITIZATION
// =============================================================================

/**
 * Maximum allowed SVG content size in bytes (10KB)
 * Prevents DoS attacks via large SVG payloads
 */
const MAX_SVG_SIZE = 10 * 1024;

/**
 * Allowed SVG tags for safe rendering
 * This whitelist approach prevents XSS via malicious SVG elements
 */
const ALLOWED_SVG_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'textPath', 'defs', 'marker', 'linearGradient', 'radialGradient',
  'stop', 'clipPath', 'mask', 'use', 'image', 'foreignObject'
]);

/**
 * Allowed SVG attributes for safe rendering
 */
const ALLOWED_SVG_ATTRS = new Set([
  // Structure
  'viewBox', 'xmlns', 'version', 'width', 'height', 'x', 'y',
  // Style
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity',
  // Text
  'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor',
  'dominant-baseline', 'alignment-baseline',
  // Shape
  'rx', 'ry', 'r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'points', 'd',
  // Effects
  'filter', 'clip-path', 'mask', 'transform', 'id', 'class',
  // Markers and gradients
  'marker-start', 'marker-end', 'marker-mid', 'offset', 'stop-color', 'stop-opacity',
  // URL references
  'href', 'xlink:href',
  // Other
  'preserveAspectRatio', 'transform'
]);

/**
 * Dangerous patterns that should never appear in SVG content
 */
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,  // Event handlers like onclick, onload
  /data:/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<link/i,
  /<style/i,
  /expression\s*\(/i,  // IE CSS expressions
  /url\s*\(\s*["']?\s*javascript:/i,  // JavaScript URLs in CSS
];

/**
 * Sanitizes SVG content to prevent XSS attacks.
 * 
 * This function implements a whitelist-based approach:
 * 1. Checks content size to prevent DoS
 * 2. Removes dangerous patterns (scripts, event handlers, etc.)
 * 3. Validates that only allowed SVG elements are present
 * 4. Removes any attributes not in the allowed list
 * 
 * @param svgContent - The raw SVG content to sanitize
 * @returns Sanitized SVG content safe for dangerouslySetInnerHTML
 * 
 * @example
 * // In a React component:
 * const sanitizedSvg = sanitizeSVG(section.svgContent);
 * return <div dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />;
 */
export function sanitizeSVG(svgContent: string): string {
  // Check for null/undefined
  if (!svgContent || typeof svgContent !== 'string') {
    return '';
  }

  // Check content size
  if (svgContent.length > MAX_SVG_SIZE) {
    console.warn('[Security] SVG content exceeds maximum size limit');
    return '';
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(svgContent)) {
      console.warn('[Security] SVG content contains potentially dangerous pattern:', pattern);
      return '';
    }
  }

  // Parse and validate SVG structure
  try {
    // Extract SVG element
    const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      return '';
    }

    let sanitized = svgMatch[0];

    // Remove any DOCTYPE declarations
    sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Remove XML declarations
    sanitized = sanitized.replace(/<\?xml[^?]*\?>/gi, '');

    // Validate all tags are in the allowed list
    const tagPattern = /<(\/?)([\w-]+)/gi;
    let match;
    while ((match = tagPattern.exec(sanitized)) !== null) {
      const tagName = match[2].toLowerCase();
      if (!ALLOWED_SVG_TAGS.has(tagName)) {
        console.warn(`[Security] SVG contains disallowed tag: ${tagName}`);
        return '';
      }
    }

    // Remove any attributes that are not allowed (basic check)
    // This is a simplified approach - for full security, use DOMPurify
    const attrPattern = /\s+([\w-:]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?/gi;
    sanitized = sanitized.replace(attrPattern, (match, attrName) => {
      // Allow data-* attributes (but sanitize them)
      if (attrName.startsWith('data-')) {
        const cleanAttr = attrName.replace(/[^\w-]/g, '');
        return ` data-${cleanAttr}`;
      }
      if (ALLOWED_SVG_ATTRS.has(attrName.toLowerCase()) || attrName.startsWith('aria-')) {
        return match;
      }
      // Remove dangerous attributes that might contain expressions
      const dangerousAttrs = ['id', 'class'];
      if (dangerousAttrs.includes(attrName.toLowerCase())) {
        return match; // Keep these but could add additional validation
      }
      return '';
    });

    return sanitized;
  } catch (error) {
    console.error('[Security] Error sanitizing SVG:', error);
    return '';
  }
}

/**
 * Validates that a string is a valid SVG fragment.
 * Use this to validate SVG content before storage.
 * 
 * @param content - The content to validate
 * @returns true if the content appears to be valid SVG
 */
export function isValidSVG(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Must contain SVG element
  if (!/<svg[\s\S]*?<\/svg>/i.test(content)) {
    return false;
  }

  // Size check
  if (content.length > MAX_SVG_SIZE) {
    return false;
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}

// =============================================================================
// GENERAL UTILITIES
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
