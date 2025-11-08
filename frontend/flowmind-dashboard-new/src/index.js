import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"; // 👈 Added for PWA
import "./style.css"; // Keep your global styles

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Register service worker for PWA install + offline support
serviceWorkerRegistration.register();
