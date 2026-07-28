import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Cookieless page + funnel analytics (only reports on Vercel prod). */}
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
