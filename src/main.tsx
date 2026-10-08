import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { installDomGuard } from "./lib/domGuard";
import "./index.css";

// Must run before React mounts so stray DOM edits never blank the page.
installDomGuard();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>,
);
