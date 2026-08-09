export type ErrorSeverity = "critical" | "warning" | "info";

export interface AppErrorOptions {
  severity?: ErrorSeverity;
  cause?: Error;
  status?: number;
  body?: unknown;
}

export class AppError extends Error {
  severity: ErrorSeverity;
  status?: number;
  body?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.severity = options.severity ?? "critical";
    this.status = options.status;
    this.body = options.body;
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  static fromApiError(apiError: { message: string; status: number; body?: unknown }): AppError {
    const severity = apiError.status && apiError.status >= 500 ? "critical" : "warning";
    return new AppError(apiError.message, {
      severity,
      status: apiError.status,
      body: apiError.body,
    });
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    if (error instanceof Error) {
      return new AppError(error.message, { cause: error });
    }
    return new AppError(String(error));
  }
}

export function isCritical(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.severity === "critical";
  }
  return true;
}
