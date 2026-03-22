import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTabsContext } from './Tabs';

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useTabsContext();
    const isActive = context.selectedTab === value;

    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        tabIndex={0}
        className={cn('focus:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

TabPanel.displayName = 'TabPanel';