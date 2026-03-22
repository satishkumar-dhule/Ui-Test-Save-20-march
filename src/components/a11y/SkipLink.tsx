/**
 * SkipLink Component
 * WCAG 2.1 AA Skip Navigation Links
 * 
 * @description Provides keyboard users with skip navigation links
 * @example <SkipLink href="#main-content">Skip to main content</SkipLink>
 */

import { useEffect, useRef, useState } from 'react';

interface SkipLinkProps {
  /** Target element ID */
  href: string;
  /** Link text */
  children: React.ReactNode;
  /** Optional class name */
  className?: string;
  /** Offset from top (for fixed headers) */
  offset?: number;
}

export function SkipLink({
  href,
  children,
  className = '',
  offset = 0,
}: SkipLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Set tabindex to make it focusable if not already
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onClick={handleClick}
      className={`skip-link ${className}`}
      style={{
        position: 'fixed',
        top: isVisible ? `${offset}px` : '-100px',
        left: '0',
        zIndex: '9999',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-primary, #1e40af)',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '0 0 4px 0',
        fontWeight: '600',
        fontSize: '0.875rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'top 0.3s ease-in-out',
        outline: '2px solid transparent',
        outlineOffset: '2px',
      }}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
    </a>
  );
}

/**
 * SkipLinks Container Component
 * Renders multiple skip links
 * 
 * @example
 * <SkipLinks>
 *   <SkipLink href="#main-content">Skip to main content</SkipLink>
 *   <SkipLink href="#navigation">Skip to navigation</SkipLink>
 *   <SkipLink href="#search">Skip to search</SkipLink>
 * </SkipLinks>
 */
interface SkipLinksProps {
  children: React.ReactNode;
  className?: string;
}

export function SkipLinks({ children, className = '' }: SkipLinksProps) {
  return (
    <nav
      className={`skip-links ${className}`}
      aria-label="Skip links"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </nav>
  );
}

/**
 * useSkipLink Hook
 * For programmatic skip link management
 * 
 * @example
 * const { skipTo } = useSkipLink();
 * 
 * useEffect(() => {
 *   skipTo('main-content');
 * }, []);
 */
export function useSkipLink() {
  const skipTo = (targetId: string) => {
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return { skipTo };
}

export default SkipLink;