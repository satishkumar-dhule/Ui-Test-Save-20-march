import React from "react";
import Card from "../src/Card";
import Button from "../src/Button";

export const NotificationsFlow: React.FC = () => {
  const items = [
    { id: 1, text: "Welcome to Revamp UI" },
    { id: 2, text: "New token tokenized design tokens" },
    { id: 3, text: "Phase 1: canonical flows ready" },
  ];
  return (
    <Card title="Notifications" className="notifications-flow">
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
          }}
        >
          <span>{it.text}</span>
          <Button label="Dismiss" onClick={() => {}} variant="secondary" />
        </div>
      ))}
    </Card>
  );
};

export default NotificationsFlow;
