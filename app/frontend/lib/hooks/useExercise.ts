import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { ExerciseStartResponseSchema } from "@/lib/schemas/exercise";

export async function fetchExerciseStart(
  exerciseId: string,
): Promise<{ title: string; questions: unknown[] }> {
  const raw = await apiRequest<unknown>(`/exercises/${exerciseId}/start`);
  return ExerciseStartResponseSchema.parse(raw);
}

export function useExercise(exerciseId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => fetchExerciseStart(exerciseId!),
    enabled: Boolean(exerciseId),
  });

  const submitTelemetry = useMutation({
    mutationFn: async (results: {
      exercise_uuid: string;
      duration_seconds: number;
      completed_at: string;
      session_metadata: Record<string, unknown>;
      question_responses: unknown[];
    }) => {
      await apiRequest("/api/assessment_sessions", {
        method: "POST",
        body: JSON.stringify(results),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  return {
    ...query,
    submitTelemetry,
  };
}
