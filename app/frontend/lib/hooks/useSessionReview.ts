import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { SessionReviewDataSchema } from "@/lib/schemas/analytics";
import type { SessionReviewData } from "@/components/analytics/types";

export async function fetchSessionReview(
  sessionId: number,
): Promise<SessionReviewData> {
  const raw = await apiRequest<unknown>(`/analytics/${sessionId}/review`);
  return SessionReviewDataSchema.parse(raw);
}

export function useSessionReview(sessionId: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["analytics", "sessionReview", sessionId],
    queryFn: () => fetchSessionReview(sessionId!),
    enabled: typeof sessionId === "number" && sessionId > 0,
    staleTime: 60_000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["analytics", "sessionReview"],
    });

  return {
    ...query,
    refresh,
  };
}
