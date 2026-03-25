import React from "react";

type Props = {
  src?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
};

export const Avatar: React.FC<Props> = ({ src, initials, size = "md" }) => {
  const diameter = size === "sm" ? 24 : size === "lg" ? 48 : 32;
  const style: React.CSSProperties = {
    width: diameter,
    height: diameter,
    borderRadius: "50%",
    background: "#2a2a3a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 600,
  };
  return (
    <div style={style} aria-label="avatar">
      {src ? (
        <img
          src={src}
          alt="avatar"
          style={{ width: "100%", height: "100%", borderRadius: "50%" }}
        />
      ) : (
        (initials ?? "?")
      )}
    </div>
  );
};

export default Avatar;
