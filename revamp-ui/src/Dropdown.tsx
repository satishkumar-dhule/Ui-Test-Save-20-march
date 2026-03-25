import React, { useState } from "react";

type Item = { label: string; value: string };
type Props = {
  items: Item[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

export const Dropdown: React.FC<Props> = ({
  items,
  onSelect,
  placeholder = "Select",
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");
  const select = (v: string) => {
    setValue(v);
    onSelect(v);
    setOpen(false);
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="rev-btn"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
      >
        {value ? value : placeholder}
      </button>
      {open && (
        <ul
          style={{
            position: "absolute",
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "#1b1b2a",
            border: "1px solid #2a2a3a",
            borderRadius: 6,
            marginTop: 4,
          }}
        >
          {items.map((it) => (
            <li key={it.value}>
              <button
                onClick={() => select(it.value)}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "#e5e7eb",
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
