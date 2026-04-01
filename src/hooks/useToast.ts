import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextType {
  toasts: Toast[];
  toast: (opts: { type: ToastType; message: string }) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}
