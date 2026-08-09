import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/apiClient";
import { TagTreeNodeSchema } from "@/lib/schemas/exercise";

export async function fetchTagTree(): Promise<z.infer<typeof TagTreeNodeSchema>[]> {
  const raw = await apiRequest<unknown>("/tag", {
    headers: { Accept: "application/json" },
  });
  return z.array(TagTreeNodeSchema).parse(raw);
}

export function useTagTree() {
  const query = useQuery({
    queryKey: ["tagTree"],
    queryFn: fetchTagTree,
    staleTime: 30_000,
  });

  return {
    tagTree: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
