import { z } from "zod";
import { apiRequest } from "./apiClient";
import { WorkspaceStateSchema } from "./schemas/workspace";

export async function validatedApiRequest<T>(
  url: string,
  options?: Parameters<typeof apiRequest<T>>[1],
): Promise<T> {
  return apiRequest<T>(url, options);
}

export async function validatedWorkspaceState(
  url: string,
  options?: Parameters<typeof apiRequest<Parameters<typeof WorkspaceStateSchema.parse>[0]>>[1],
): Promise<z.infer<typeof WorkspaceStateSchema>> {
  const data = await apiRequest<Parameters<typeof WorkspaceStateSchema.parse>[0]>(url, options);
  return WorkspaceStateSchema.parse(data);
}
