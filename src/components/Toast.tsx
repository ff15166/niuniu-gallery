"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ToastCtx {
  toast: (msg: string) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastContext.Provider>
  );
}
