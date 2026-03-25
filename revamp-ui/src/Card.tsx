import React from "react";

type CardProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <section className={`rev-card ${className}`} aria-label={title ?? "card"}>
      {title ? <h3 className="rev-card-title">{title}</h3> : null}
      <div className="rev-card-content">{children}</div>
    </section>
  );
};

export default Card;
