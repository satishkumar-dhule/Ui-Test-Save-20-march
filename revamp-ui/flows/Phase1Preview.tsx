import React, { Suspense } from "react";
import Shell from "../src/Shell";
import SearchDiscoveryFlow from "./SearchDiscovery";
import ProfileSettingsFlow from "./ProfileSettings";
import ContentDiscoveryFlow from "./ContentDiscovery";
import NotificationsFlow from "./Notifications";

export const Phase1Preview: React.FC = () => {
  return (
    <Shell title="Phase 1 Preview">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchDiscoveryFlow />
        <div style={{ height: 16 }} />
        <ProfileSettingsFlow />
        <div style={{ height: 16 }} />
        <ContentDiscoveryFlow />
        <div style={{ height: 16 }} />
        <NotificationsFlow />
      </Suspense>
    </Shell>
  );
};

export default Phase1Preview;
