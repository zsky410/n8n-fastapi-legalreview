import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthModalProvider } from "./hooks/useAuthModal.js";
import { AuthProvider } from "./hooks/useAuth.js";
import { CasesProvider } from "./hooks/useCases.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CasesProvider>
          <AuthModalProvider>
            <App />
          </AuthModalProvider>
        </CasesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
