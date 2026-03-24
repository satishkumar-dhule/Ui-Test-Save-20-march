import React from "react";
import Phase1Preview from "../flows/Phase1Preview";
import "../styles/global.css";

export const Preview: React.FC = () => {
  return (
    <div className="rev-shell">
      <div
        className="rev-container"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
        <Phase1Preview />
      </div>
    </div>
  );
};

export default Preview;
