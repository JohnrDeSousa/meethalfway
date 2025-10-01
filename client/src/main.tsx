import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { setupRuntimeContrastCheck } from "./utils/contrastChecker";

// Setup accessibility contrast checking in development
if (import.meta.env.DEV) {
  setupRuntimeContrastCheck();
}

createRoot(document.getElementById("root")!).render(<App />);
