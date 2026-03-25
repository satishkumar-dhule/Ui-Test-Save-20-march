import React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label={title ?? "modal"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.5)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1b1b2a",
          borderRadius: 8,
          padding: 16,
          minWidth: 300,
          boxShadow: "0 4px 20px rgba(0,0,0,.4)",
        }}
      >
        {title ? (
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>{title}</div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
