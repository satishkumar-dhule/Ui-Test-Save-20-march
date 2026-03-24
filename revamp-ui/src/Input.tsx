import React from "react";

type InputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
};

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`rev-input ${className}`}
      aria-label={placeholder}
      style={{
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        border: "1px solid #2a2a3a",
        background: "#1b1b2a",
        color: "#e5e7eb",
      }}
    />
  );
};

export default Input;
