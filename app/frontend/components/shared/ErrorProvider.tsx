import React, { createContext, useContext, useState, useCallback } from "react";
import { AppError, ErrorSeverity } from "@/lib/errors";

interface ErrorContextValue {
  reportError: (error: unknown, severity?: ErrorSeverity) => void;
  reportCritical: (error: unknown) => void;
  reportWarning: (error: unknown) => void;
  reportInfo: (message: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);

  const reportError = useCallback((error: unknown, severity: ErrorSeverity = "critical") => {
    const appError = AppError.fromUnknown(error);
    appError.severity = severity;
    setCurrentError(appError);
    console.error(`[${severity.toUpperCase()}]`, appError);
  }, []);

  const reportCritical = useCallback((error: unknown) => {
    reportError(error, "critical");
  }, [reportError]);

  const reportWarning = useCallback((error: unknown) => {
    reportError(error, "warning");
  }, [reportError]);

  const reportInfo = useCallback((message: string) => {
    const appError = new AppError(message, { severity: "info" });
    setCurrentError(appError);
    console.info("[INFO]", appError);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  return (
    <ErrorContext.Provider
      value={{ reportError, reportCritical, reportWarning, reportInfo, clearError }}
    >
      {children}
      {currentError && currentError.severity === "critical" && (
        <ErrorScreen
          title="Application Error"
          message={currentError.message}
          details={currentError.stack}
          onDismiss={clearError}
        />
      )}
    </ErrorContext.Provider>
  );
};

export function useAppErrors() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useAppErrors must be used within an ErrorProvider");
  }
  return context;
}

export default ErrorProvider;
