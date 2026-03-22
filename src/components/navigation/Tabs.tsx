import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface TabsContextValue {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  orientation: 'horizontal' | 'vertical';
  variant: 'line' | 'pill' | 'enclosed';
  size: 'sm' | 'md' | 'lg';
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a Tabs component');
  }
  return context;
}

export interface TabsProps {
  defaultTab: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'line' | 'pill' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  onChange?: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultTab,
  orientation = 'horizontal',
  variant = 'line',
  size = 'md',
  onChange,
  children,
  className,
}: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedTab(tab);
      onChange?.(tab);
    },
    [onChange],
  );

  const value = useMemo<TabsContextValue>(
    () => ({
      selectedTab,
      setSelectedTab: handleTabChange,
      orientation,
      variant,
      size,
    }),
    [selectedTab, handleTabChange, orientation, variant, size],
  );

  return (
    <TabsContext.Provider value={value}>
      <div
        className={className}
        role="tablist"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-variant={variant}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}