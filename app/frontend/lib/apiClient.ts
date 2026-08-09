import { getCsrfToken } from "./getCsrfToken";
import { ApiError } from "./apiError";

export async function apiRequest<T>(
  url: string,
  options?: RequestInit & { allow304?: boolean },
): Promise<T | null> {
  const csrf = getCsrfToken();
  const mergedHeaders = {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf,
    Accept: "application/json",
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (options?.allow304 && response.status === 304) {
    return null;
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.errors) {
        errorMessage = Array.isArray(errorData.errors)
          ? errorData.errors.join(", ")
          : String(errorData.errors);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, null);
  }

  try {
    return await response.json();
  } catch {
    return undefined as T;
  }
}
