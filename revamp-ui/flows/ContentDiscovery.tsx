import React from "react";
import Shell from "../src/Shell";
import Card from "../src/Card";

export const ContentDiscoveryFlow: React.FC = () => {
  const items = ["Article A", "Video B", "Card C", "Quiz D"];
  return (
    <Shell title="Content Discovery">
      <Card title="Recommended for you">
        {items.map((it) => (
          <div key={it} style={{ padding: "6px 0" }}>
            {it}
          </div>
        ))}
      </Card>
    </Shell>
  );
};

export default ContentDiscoveryFlow;
