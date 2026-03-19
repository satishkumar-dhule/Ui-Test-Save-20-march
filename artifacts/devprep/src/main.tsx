import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, AppProviders } from "./components/app/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
