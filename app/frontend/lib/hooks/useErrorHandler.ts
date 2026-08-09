import { useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";
import { AppError, isCritical } from "@/lib/errors";

const TOAST_OPTIONS = {
  position: "bottom-left" as const,
  duration: 5000,
};

export function useErrorHandler() {
  const handleError = useCallback((error: unknown): boolean => {
    const appError = AppError.fromUnknown(error);

    if (isCritical(appError)) {
      console.error("[Critical Error]", appError);
      return false;
    }

    console.warn("[Non-critical Error]", appError);
    toast.error(appError.message, { ...TOAST_OPTIONS, duration: 6000 });
    return true;
  }, []);

  const showToast = useCallback(
    (message: string, severity: "success" | "error" | "warning" | "info" = "success") => {
      if (severity === "error") {
        toast.error(message, TOAST_OPTIONS);
      } else if (severity === "warning") {
        toast(message, { ...TOAST_OPTIONS, icon: "⚠️" });
      } else if (severity === "info") {
        toast(message, { ...TOAST_OPTIONS, icon: "ℹ️" });
      } else {
        toast.success(message, TOAST_OPTIONS);
      }
    },
    [],
  );

  const withErrorHandling = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error);
        return undefined;
      }
    },
    [handleError],
  );

  return { handleError, showToast, withErrorHandling };
}

export { Toaster };
