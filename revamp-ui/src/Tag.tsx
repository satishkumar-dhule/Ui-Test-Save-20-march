import React from "react";

type Props = {
  label: string;
  color?: string;
};

export const Tag: React.FC<Props> = ({ label, color = "#2a2a3a" }) => {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
      }}
      aria-label={`tag-${label}`}
    >
      {label}
    </span>
  );
};

export default Tag;
