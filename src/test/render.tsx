import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { TokenProvider } from "../token";

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <TokenProvider>{children}</TokenProvider>
    </QueryClientProvider>
  );
  return { client, ...render(ui, { wrapper: Wrapper, ...options }) };
}
