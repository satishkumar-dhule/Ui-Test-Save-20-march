import React, { forwardRef, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { useTabsContext } from './Tabs';

const tabVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        line: 'border-b-2 border-transparent py-2 px-4 -mb-px',
        pill: 'rounded-full px-3 py-1.5',
        enclosed: 'rounded-md px-3 py-1.5',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
      isActive: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'line',
        isActive: true,
        className: 'border-primary text-primary',
      },
      {
        variant: 'line',
        isActive: false,
        className: 'hover:text-foreground/80',
      },
      {
        variant: 'pill',
        isActive: true,
        className: 'bg-primary text-primary-foreground',
      },
      {
        variant: 'pill',
        isActive: false,
        className: 'hover:bg-muted hover:text-muted-foreground',
      },
      {
        variant: 'enclosed',
        isActive: true,
        className: 'bg-background text-foreground shadow-sm',
      },
      {
        variant: 'enclosed',
        isActive: false,
        className: 'hover:bg-muted/50',
      },
    ],
    defaultVariants: {
      variant: 'line',
      size: 'md',
      isActive: false,
    },
  },
);

export interface TabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabVariants> {
  value: string;
  badge?: React.ReactNode;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  (
    {
      className,
      variant,
      size,
      value,
      badge,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const context = useTabsContext();
    const isActive = context.selectedTab === value;
    const tabRef = useRef<HTMLButtonElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLButtonElement>) || tabRef;

    useEffect(() => {
      if (isActive && combinedRef.current) {
        combinedRef.current.focus();
      }
    }, [isActive, combinedRef]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      context.setSelectedTab(value);
      onClick?.(event);
    };

    return (
      <button
        ref={combinedRef}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        id={`tab-${value}`}
        tabIndex={isActive ? 0 : -1}
        className={cn(
          tabVariants({
            variant: context.variant,
            size: context.size,
            isActive,
            className,
          }),
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
        {badge && <span className="ml-2">{badge}</span>}
      </button>
    );
  },
);

Tab.displayName = 'Tab';