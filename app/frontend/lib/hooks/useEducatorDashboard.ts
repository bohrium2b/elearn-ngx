import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { z } from "zod";
import {
  CohortMetricsSchema,
  TagMatrixNodeSchema,
  ItemDiscriminationSchema,
} from "@/lib/schemas/analytics";
import type { CohortMetrics, TagMatrixNode, ItemDiscrimination } from "@/components/analytics/types";

export async function fetchCohortMetrics(): Promise<CohortMetrics> {
  const raw = await apiRequest<unknown>("/analytics/cohort");
  return CohortMetricsSchema.parse(raw);
}

export async function fetchTagMatrix(): Promise<TagMatrixNode[]> {
  const raw = await apiRequest<unknown>("/analytics/tag_matrix");
  return z.array(TagMatrixNodeSchema).parse(raw);
}

export async function fetchItemDiscrimination(): Promise<ItemDiscrimination[]> {
  const raw = await apiRequest<unknown>("/analytics/item_discrimination");
  return z.array(ItemDiscriminationSchema).parse(raw);
}

export function useEducatorDashboard() {
  const queryClient = useQueryClient();

  const cohortQuery = useQuery({
    queryKey: ["analytics", "cohort"],
    queryFn: fetchCohortMetrics,
    staleTime: 30_000,
  });

  const tagMatrixQuery = useQuery({
    queryKey: ["analytics", "tagMatrix"],
    queryFn: fetchTagMatrix,
    staleTime: 30_000,
  });

  const itemQuery = useQuery({
    queryKey: ["analytics", "itemDiscrimination"],
    queryFn: fetchItemDiscrimination,
    staleTime: 30_000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["analytics"] });

  const isLoading = cohortQuery.isLoading || tagMatrixQuery.isLoading || itemQuery.isLoading;
  const error = cohortQuery.error ?? tagMatrixQuery.error ?? itemQuery.error;

  return {
    cohort: cohortQuery.data ?? null,
    tagMatrix: tagMatrixQuery.data ?? [],
    items: itemQuery.data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refresh,
    isFetching: cohortQuery.isFetching || tagMatrixQuery.isFetching || itemQuery.isFetching,
  };
}
