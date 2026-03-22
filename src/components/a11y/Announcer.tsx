/**
 * Announcer Component
 * WCAG 2.1 AA Live Region for Screen Reader Announcements
 * 
 * @description Provides a centralized announcer for dynamic content changes
 * @example <Announcer message="Item added to cart" priority="polite" />
 */

import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';

interface AnnouncerProps {
  /** Message to announce */
  message: string;
  /** Announcement priority */
  priority?: 'polite' | 'assertive';
  /** Unique ID for the announcer element */
  id?: string;
  /** Clear message after announcement */
  clearAfter?: number;
}

export function Announcer({
  message,
  priority = 'polite',
  id = 'a11y-announcer',
  clearAfter = 1000,
}: AnnouncerProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!announcement) return null;

  return createPortal(
    <div
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>,
    document.body
  );
}

/**
 * useAnnouncer Hook
 * Custom hook for managing screen reader announcements
 * 
 * @example
 * const { announce, AnnouncerComponent } = useAnnouncer();
 * 
 * function handleAddItem() {
 *   announce('Item added to cart', 'polite');
 * }
 * 
 * return (
 *   <>
 *     <button onClick={handleAddItem}>Add to Cart</button>
 *     <AnnouncerComponent />
 *   </>
 * );
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    priority: 'polite' | 'assertive';
  } | null>(null);

  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({ message, priority });
    // Clear after announcement
    setTimeout(() => setAnnouncement(null), 1000);
  };

  const AnnouncerComponent = () => {
    if (!announcement) return null;

    return (
      <div
        role="status"
        aria-live={announcement.priority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement.message}
      </div>
    );
  };

  return { announce, AnnouncerComponent };
}

/**
 * StatusAnnouncer Component
 * For status messages that don't need immediate announcement
 * 
 * @example <StatusAnnouncer status="Loading complete" />
 */
export function StatusAnnouncer({
  status,
  id = 'a11y-status',
}: {
  status: string;
  id?: string;
}) {
  if (!status) return null;

  return (
    <div
      id={id}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      className="sr-only"
    >
      {status}
    </div>
  );
}

export default Announcer;