import React from "react";

type ButtonProps = {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = "primary",
  disabled,
  className = "",
}) => {
  const cls = ["rev-btn", variant, className].filter(Boolean).join(" ");
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={!!disabled}
      aria-disabled={!!disabled}
    >
      {label}
    </button>
  );
};

export default Button;
