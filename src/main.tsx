import React from "react";
import ReactDOM from "react-dom/client";
import { AnalyticsProvider } from "./analytics";
import { BrowserRouter } from "./router";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AnalyticsProvider>
      <BrowserRouter>
        <App />
        {/* Cookieless page + funnel analytics (only reports on Vercel prod). */}
        <Analytics />
      </BrowserRouter>
    </AnalyticsProvider>
  </React.StrictMode>
);
