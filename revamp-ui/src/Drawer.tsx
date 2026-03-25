import React from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  width?: number;
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = 320,
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width,
        background: "#1b1b2a",
        boxShadow: "-4px 0 20px rgba(0,0,0,.4)",
        zIndex: 1000,
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid #2a2a3a" }}>
        <strong>{title ?? "Drawer"}</strong>
        <button onClick={onClose} style={{ float: "right" }}>
          Close
        </button>
      </div>
      <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};

export default Drawer;
