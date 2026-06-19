/**
 * useToast.ts - Custom hook for toast notifications
 *
 * Provides a simple interface for showing success and error toasts.
 */

import { useCallback } from "react";

interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

// Simple toast implementation using MUI Snackbar pattern
// This can be replaced with react-hot-toast if preferred

let toastHandler:
  | ((message: string, type: "success" | "error") => void)
  | null = null;

export const setToastHandler = (
  handler: (message: string, type: "success" | "error") => void,
) => {
  toastHandler = handler;
};

export const showToast = (
  message: string,
  type: "success" | "error" = "success",
) => {
  if (toastHandler) {
    toastHandler(message, type);
  } else {
    // Fallback to console if no handler is set
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

export const useToast = () => {
  const success = useCallback((message: string, _options?: ToastOptions) => {
    showToast(message, "success");
  }, []);

  const error = useCallback((message: string, _options?: ToastOptions) => {
    showToast(message, "error");
  }, []);

  return { success, error };
};

export default useToast;
