import React, { useState } from "react";
import Shell from "../src/Shell";
import Card from "../src/Card";
import Tabs from "../src/Tabs";
import Button from "../src/Button";
import Drawer from "../src/Drawer";

export const SettingsRevamp: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabs = [
    { label: "Account", content: <AccountTab /> },
    { label: "Preferences", content: <PreferencesTab /> },
    { label: "Billing", content: <BillingTab /> },
  ];

  return (
    <Shell title="Settings Revamp">
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Card title="Settings">
          <Tabs tabs={tabs} />
        </Card>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Quick Settings"
          width={280}
        >
          <Button
            label="Toggle Dark Mode"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
          <Button
            label="Export Data"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
          <Button
            label="Logout"
            onClick={() => {
              /* TODO */
            }}
            variant="secondary"
          />
        </Drawer>
        <Button
          label="Open Settings Drawer"
          onClick={() => setDrawerOpen(true)}
        />
      </div>
    </Shell>
  );
};

const AccountTab: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p>Account settings placeholder.</p>
  </div>
);

const PreferencesTab: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p>Preferences settings placeholder.</p>
  </div>
);

const BillingTab: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p>Billing settings placeholder.</p>
  </div>
);

export default SettingsRevamp;
