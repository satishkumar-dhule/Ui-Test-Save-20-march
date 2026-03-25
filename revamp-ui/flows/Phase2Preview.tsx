import React, { useState } from "react";
import Shell from "../src/Shell";
import Tabs from "../src/Tabs";
import Drawer from "../src/Drawer";
import Button from "../src/Button";
import NotificationsCenter from "./NotificationsCenter";
import SettingsRevamp from "./SettingsRevamp";

export const Phase2Preview: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabs = [
    {
      label: "Overview",
      content: (
        <div style={{ padding: 16 }}>
          <h2>Phase 2 Overview</h2>
          <p>This section demonstrates the Drawer and Tabs components.</p>
          <Button label="Open Drawer" onClick={() => setDrawerOpen(true)} />
          <div style={{ height: 8 }} />
          <div>
            <h3>Tabs Demo</h3>
            <Tabs
              tabs={[
                { label: "Tab 1", content: <div>Content for tab 1</div> },
                { label: "Tab 2", content: <div>Content for tab 2</div> },
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Notifications",
      content: <NotificationsCenter />,
    },
    {
      label: "Settings",
      content: <SettingsRevamp />,
    },
  ];

  return (
    <Shell title="Phase 2 Preview">
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Tabs tabs={tabs} />
        </div>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Quick Actions"
          width={280}
        >
          <Button
            label="Refresh"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
          <Button
            label="Settings"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
          <Button
            label="Help"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
        </Drawer>
        <Button label="Open Drawer" onClick={() => setDrawerOpen(true)} />
      </div>
    </Shell>
  );
};

export default Phase2Preview;
