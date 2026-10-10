import React from "react";
import ReactDOM from "react-dom/client";
import { AnalyticsProvider } from "./analytics";
import { BrowserRouter } from "./router";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import ErrorBoundary from "./ui/ErrorBoundary";
import AppCrash from "./ui/AppCrash";
import "./index.css";
import { reloadOnce } from "./lazy-reload";

// Vite fires this when a preloaded chunk 404s, which is what a tab opened
// before a deploy sees. Reload once onto the new build (see lazy-reload.ts).
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnce()) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AnalyticsProvider>
      {/* Outermost: without this a throw anywhere outside the world rendered a
          blank page, with no way out and no report. */}
      <ErrorBoundary area="app" fallback={<AppCrash />}>
        <BrowserRouter>
          <App />
          {/* Cookieless page + funnel analytics (only reports on Vercel prod). */}
          <Analytics />
        </BrowserRouter>
      </ErrorBoundary>
    </AnalyticsProvider>
  </React.StrictMode>
);
