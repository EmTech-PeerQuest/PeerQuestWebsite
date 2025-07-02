"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Toast } from "@/components/toast";

interface ToastData {
  message: string;
  type?: string;
  id: number;
}

interface ToastContextType {
  showToast: (message: string, type?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToastContext = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const showToast = useCallback((message: string, type: string = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type || "success"}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
