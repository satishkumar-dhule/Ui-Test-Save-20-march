import React from 'react';
import { Tabs, TabList, Tab, TabPanel } from '..';

interface ContentTypeTabsProps {
  defaultTab?: string;
  onChange?: (tab: string) => void;
  children: React.ReactNode;
}

export function ContentTypeTabs({
  defaultTab = 'questions',
  onChange,
  children,
}: ContentTypeTabsProps) {
  return (
    <Tabs defaultTab={defaultTab} onChange={onChange}>
      <TabList>
        <Tab value="questions">Questions</Tab>
        <Tab value="flashcards">Flashcards</Tab>
        <Tab value="exams">Exams</Tab>
        <Tab value="coding">Coding</Tab>
        <Tab value="voice">Voice</Tab>
      </TabList>
      {children}
    </Tabs>
  );
}

export function ContentTypeTabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  return <TabPanel value={value}>{children}</TabPanel>;
}