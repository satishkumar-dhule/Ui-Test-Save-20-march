import React from "react";

type Props = {
  title?: string;
  children?: React.ReactNode;
};

export const Shell: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="rev-shell" data-theme="light">
      <header
        style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a3a" }}
      >
        <strong>{title ?? "Revamp UI Shell"}</strong>
      </header>
      <main className="rev-container">{children}</main>
    </div>
  );
};

export default Shell;
