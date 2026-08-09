import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { DashboardDataSchema } from "@/lib/schemas/analytics";
import type { DashboardData } from "@/components/analytics/types";

export async function fetchDashboardData(): Promise<DashboardData> {
  const raw = await apiRequest<unknown>("/analytics/dashboard");
  return DashboardDataSchema.parse(raw);
}

export function useAnalyticsDashboard() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 30_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["analytics"] });

  return {
    ...query,
    refresh,
  };
}
