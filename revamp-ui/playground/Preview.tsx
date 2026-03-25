import React from "react";
import Phase2Preview from "../flows/Phase2Preview";
import "../styles/global.css";

export const Preview: React.FC = () => {
  return (
    <div className="rev-shell">
      <div
        className="rev-container"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
        <Phase2Preview />
      </div>
    </div>
  );
};

export default Preview;
