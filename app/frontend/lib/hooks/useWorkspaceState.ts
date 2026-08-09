import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { apiRequest } from "@/lib/apiClient";
import { WorkspaceStateSchema } from "@/lib/schemas/workspace";
import type { WorkspaceState } from "@/components/workspace/types";

export async function fetchWorkspaceState(
  refreshPath: string,
  etag?: string | null,
): Promise<{ data: WorkspaceState | null; etag: string | null }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (etag) {
    headers["If-None-Match"] = etag;
  }

  const payload = await apiRequest<unknown>(refreshPath, {
    headers,
    allow304: true,
  });

  if (payload === null) {
    return { data: null, etag: etag ?? null };
  }

  const validated = WorkspaceStateSchema.parse(payload);
  return { data: validated, etag: etag ?? null };
}

export function useWorkspaceState(refreshPath: string | null) {
  const queryClient = useQueryClient();
  const etagRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["workspace", refreshPath],
    queryFn: async () => {
      if (!refreshPath) throw new Error("No refresh path");
      const result = await fetchWorkspaceState(refreshPath, etagRef.current);
      if (result.data) {
        etagRef.current = result.etag;
        return result.data;
      }
      const cached = queryClient.getQueryData<WorkspaceState>(["workspace", refreshPath]);
      return cached ?? null;
    },
    enabled: Boolean(refreshPath),
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });

  const invalidateWorkspace = useMutation({
    mutationFn: async () => {
      if (!refreshPath) throw new Error("No refresh path");
      const result = await fetchWorkspaceState(refreshPath, etagRef.current);
      if (result.data) {
        etagRef.current = result.etag;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });

  return {
    ...query,
    invalidateWorkspace,
  };
}
