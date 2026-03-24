import React, { useState } from "react";
import Shell from "../src/Shell";
import Card from "../src/Card";
import Input from "../src/Input";
import Button from "../src/Button";

export const SearchDiscoveryFlow: React.FC = () => {
  const [q, setQ] = useState("");
  // Fake results
  const results = Array.from({ length: 4 }).map(
    (_, i) => `Result ${i + 1} for ${q || "query"}`,
  );
  return (
    <Shell title="Search & Discover">
      <Card title="Search">
        <Input
          placeholder="Search items"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button label="Search" onClick={() => {}} />
      </Card>
      <div style={{ height: 12 }} />
      <Card title="Results">
        {results.map((r) => (
          <div key={r} style={{ padding: "6px 0" }}>
            {r}
          </div>
        ))}
      </Card>
    </Shell>
  );
};

export default SearchDiscoveryFlow;
