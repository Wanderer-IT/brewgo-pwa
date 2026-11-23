import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./context/ToastContext";
import { NetworkStatusProvider } from "./context/NetworkStatusContext";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";

// The service worker is registered by <ReloadPrompt /> (useRegisterSW from vite-plugin-pwa), rendered inside <App />.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <NetworkStatusProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </NetworkStatusProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
