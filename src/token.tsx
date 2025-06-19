import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// The optional personal access token lives only in React state. It is never
// written to localStorage, sessionStorage, cookies or the URL, so it is gone
// as soon as the tab is closed or reloaded.

interface TokenState {
  token: string;
  setToken: (token: string) => void;
}

const TokenContext = createContext<TokenState>({ token: "", setToken: () => {} });

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const value = useMemo(() => ({ token, setToken: (t: string) => setToken(t.trim()) }), [token]);
  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToken() {
  return useContext(TokenContext);
}
