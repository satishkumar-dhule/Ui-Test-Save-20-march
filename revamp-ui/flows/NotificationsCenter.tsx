import React, { useState } from "react";
import Shell from "../src/Shell";
import Card from "../src/Card";
import Tabs from "../src/Tabs";
import Button from "../src/Button";
import Tag from "../src/Tag";

export const NotificationsCenter: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const tabs = [
    { label: "All", content: <AllNotifications /> },
    { label: "Updates", content: <UpdatesNotifications /> },
    { label: "Mentions", content: <MentionsNotifications /> },
  ];

  return (
    <Shell title="Notifications Center">
      <Card title="Your Notifications">
        <Tabs tabs={tabs} />
      </Card>
    </Shell>
  );
};

const AllNotifications: React.FC = () => {
  const notifications = [
    { id: 1, text: "Welcome to Revamp UI", type: "info" },
    { id: 2, text: "New token tokenized design tokens", type: "update" },
    { id: 3, text: "Phase 1: canonical flows ready", type: "update" },
    { id: 4, text: "You have a new mention", type: "mention" },
    { id: 5, text: "System maintenance scheduled", type: "info" },
  ];
  return (
    <div style={{ padding: 16 }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #2a2a3a",
          }}
        >
          <span>{n.text}</span>
          <Tag
            label={n.type.toUpperCase()}
            color={
              n.type === "info"
                ? "#5B21B6"
                : n.type === "update"
                  ? "#14B8A6"
                  : "#F59E0B"
            }
          />
        </div>
      ))}
    </div>
  );
};

const UpdatesNotifications: React.FC = () => {
  const notifications = [
    { id: 1, text: "New token tokenized design tokens", type: "update" },
    { id: 2, text: "Phase 1: canonical flows ready", type: "update" },
  ];
  return (
    <div style={{ padding: 16 }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #2a2a3a",
          }}
        >
          <span>{n.text}</span>
          <Tag label={n.type.toUpperCase()} color="#14B8A6" />
        </div>
      ))}
    </div>
  );
};

const MentionsNotifications: React.FC = () => {
  const notifications = [
    { id: 1, text: "You have a new mention", type: "mention" },
  ];
  return (
    <div style={{ padding: 16 }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #2a2a3a",
          }}
        >
          <span>{n.text}</span>
          <Tag label={n.type.toUpperCase()} color="#F59E0B" />
        </div>
      ))}
    </div>
  );
};

export default NotificationsCenter;
