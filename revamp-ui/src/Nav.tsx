import React from "react";

type NavItem = { label: string; href?: string };
type NavProps = { items: NavItem[]; ariaLabel?: string };

export const Nav: React.FC<NavProps> = ({
  items,
  ariaLabel = "navigation",
}) => {
  return (
    <nav className="rev-nav" aria-label={ariaLabel}>
      <ul
        style={{
          display: "flex",
          gap: "12px",
          padding: 0,
          margin: 0,
          listStyle: "none",
        }}
      >
        {items.map((it) => (
          <li key={it.label}>
            <a
              href={it.href ?? "#"}
              style={{ color: "#E5E7EB", textDecoration: "none" }}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Nav;
