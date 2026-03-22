import React, { forwardRef, useRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { useTabsContext } from './Tabs';

const tabListVariants = cva(
  'flex',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      variant: {
        line: 'border-b',
        pill: 'gap-2',
        enclosed: 'rounded-lg bg-muted p-1',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        variant: 'line',
        className: 'border-b',
      },
      {
        orientation: 'vertical',
        variant: 'line',
        className: 'border-r',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'line',
    },
  },
);

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  isScrollable?: boolean;
  scrollButtons?: 'auto' | 'on' | 'off';
}

export const TabList = forwardRef<HTMLDivElement, TabListProps>(
  (
    {
      className,
      isScrollable = false,
      scrollButtons = 'auto',
      children,
      ...props
    },
    ref,
  ) => {
    const context = useTabsContext();
    const listRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || listRef;

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      const tabs = Array.from(
        listRef.current?.querySelectorAll('[role="tab"]') || [],
      ) as HTMLElement[];
      const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
          if (context.orientation === 'horizontal') {
            nextIndex = currentIndex + 1;
            if (nextIndex >= tabs.length) nextIndex = 0;
          }
          break;
        case 'ArrowLeft':
          if (context.orientation === 'horizontal') {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = tabs.length - 1;
          }
          break;
        case 'ArrowDown':
          if (context.orientation === 'vertical') {
            nextIndex = currentIndex + 1;
            if (nextIndex >= tabs.length) nextIndex = 0;
          }
          break;
        case 'ArrowUp':
          if (context.orientation === 'vertical') {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = tabs.length - 1;
          }
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        tabs[nextIndex]?.focus();
        tabs[nextIndex]?.click();
      }
    };

    // Scroll buttons logic
    const showScrollButtons =
      scrollButtons === 'on' ||
      (scrollButtons === 'auto' && isScrollable);

    return (
      <div
        ref={combinedRef}
        role="tablist"
        aria-orientation={context.orientation}
        className={cn(
          tabListVariants({
            orientation: context.orientation,
            variant: context.variant,
            className,
          }),
          isScrollable && 'overflow-x-auto',
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {showScrollButtons && (
          <button
            className="hidden"
            aria-label="Scroll left"
            // TODO: implement scroll left
          />
        )}
        {children}
        {showScrollButtons && (
          <button
            className="hidden"
            aria-label="Scroll right"
            // TODO: implement scroll right
          />
        )}
      </div>
    );
  },
);

TabList.displayName = 'TabList';