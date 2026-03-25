import React, { useState } from "react";

type Tab = { label: string; content?: React.ReactNode };
type Props = { tabs: Tab[] };

export const Tabs: React.FC<Props> = ({ tabs }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div>
      <div
        style={{ display: "flex", gap: 8, borderBottom: "1px solid #2a2a3a" }}
      >
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setIdx(i)}
            style={{
              padding: "8px 12px",
              background: i === idx ? "#2a2a3a" : "transparent",
              color: "#e5e7eb",
              border: "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 12 }}>{tabs[idx]?.content}</div>
    </div>
  );
};

export default Tabs;
