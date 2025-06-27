import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, readTheme } from "./components/ThemeToggle";
import { createQueryClient } from "./hooks";
import { TokenProvider } from "./token";
import "./index.css";

applyTheme(readTheme());

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TokenProvider>
        <App />
      </TokenProvider>
    </QueryClientProvider>
  </StrictMode>,
);
