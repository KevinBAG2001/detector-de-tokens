import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if ("__TAURI_INTERNALS__" in window || "__TAURI__" in window) {
  document.body.classList.add("hotbar-tauri");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
