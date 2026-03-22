/**
 * LiveRegion Component
 * WCAG 2.1 AA Dynamic Content Announcements
 * 
 * @description Announces dynamic content changes to screen readers
 * @example <LiveRegion aria-live="polite">Content updated</LiveRegion>
 */

import { useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
  /** Live region priority */
  'aria-live'?: 'polite' | 'assertive' | 'off';
  /** Region role */
  role?: 'alert' | 'status' | 'log' | 'marquee' | 'timer' | 'progressbar';
  /** Atomic update (entire region or just changes) */
  'aria-atomic'?: boolean;
  /** Content to announce */
  children: React.ReactNode;
  /** Optional class name */
  className?: string;
  /** Relevance (for screen reader filtering) */
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all' | 'additions removals' | 'additions text' | 'removals text';
  /** Unique ID */
  id?: string;
}

export function LiveRegion({
  'aria-live': ariaLive = 'polite',
  role,
  'aria-atomic': ariaAtomic = true,
  children,
  className = '',
  'aria-relevant': ariaRelevant = 'additions text',
  id,
}: LiveRegionProps) {
  return (
    <div
      id={id}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      aria-relevant={ariaRelevant}
      role={role}
      className={`live-region sr-only ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Alert Component
 * For important messages that require immediate attention
 * 
 * @example <Alert type="error">Form submission failed</Alert>
 */
interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  role?: 'alert' | 'status';
}

const alertStyles = {
  success: {
    bg: 'var(--color-success-light, #dcfce7)',
    border: 'var(--color-success, #16a34a)',
    text: 'var(--color-success-dark, #15803d)',
  },
  error: {
    bg: 'var(--color-error-light, #fee2e2)',
    border: 'var(--color-error, #dc2626)',
    text: 'var(--color-error-dark, #b91c1c)',
  },
  warning: {
    bg: 'var(--color-warning-light, #fef3c7)',
    border: 'var(--color-warning, #f59e0b)',
    text: 'var(--color-warning-dark, #b45309)',
  },
  info: {
    bg: 'var(--color-info-light, #dbeafe)',
    border: 'var(--color-info, #3b82f6)',
    text: 'var(--color-info-dark, #1d4ed8)',
  },
};

export function Alert({
  type = 'info',
  children,
  onClose,
  className = '',
  role = 'alert',
}: AlertProps) {
  const styles = alertStyles[type];
  
  return (
    <div
      role={role}
      className={`alert alert-${type} ${className}`}
      style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        borderLeft: `4px solid ${styles.border}`,
        backgroundColor: styles.bg,
        color: styles.text,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div className="alert-content">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="alert-close"
          aria-label="Close alert"
          style={{
            background: 'transparent',
            border: 'none',
            color: styles.text,
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}

/**
 * useLiveRegion Hook
 * For programmatic live region announcements
 * 
 * @example
 * const { message, announce } = useLiveRegion();
 * 
 * return (
 *   <>
 *     <button onClick={() => announce('Item added to cart')}>
 *       Add to Cart
 *     </button>
 *     <LiveRegion aria-live="polite">{message}</LiveRegion>
 *   </>
 * );
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<number | null>(null);

  const announce = (
    text: string,
    clearAfter: number = 1000
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setMessage(text);
    
    timeoutRef.current = window.setTimeout(() => {
      setMessage('');
    }, clearAfter);
  };

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  };

  return { message, announce, clear };
}

/**
 * StatusMessage Component
 * For non-critical status updates
 * 
 * @example <StatusMessage message="Loading complete" />
 */
export function StatusMessage({
  message,
  id = 'a11y-status',
}: {
  message: string;
  id?: string;
}) {
  if (!message) return null;

  return (
    <LiveRegion
      id={id}
      aria-live="polite"
      role="status"
    >
      {message}
    </LiveRegion>
  );
}

export default LiveRegion;