import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/auth-context'
import { getApiClient, type ReviewInput, type SubmitEvidenceInput } from '../lib/api'
import type { WorkflowStep } from '../types'

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  workflow: ['workflow'] as const,
}

function useRequiredSession() {
  const { session } = useAuth()
  if (!session) throw new Error('An authenticated session is required.')
  return session
}

export function useDashboard() {
  const session = useRequiredSession()
  return useQuery({
    queryKey: [...queryKeys.dashboard, session.user.id],
    queryFn: () => getApiClient().dashboard(session.user, session.token),
  })
}

export function useWorkflow() {
  const session = useRequiredSession()
  return useQuery({
    queryKey: queryKeys.workflow,
    queryFn: () => getApiClient().workflow(session.token),
  })
}

export function useSubmitEvidence() {
  const session = useRequiredSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitEvidenceInput) =>
      getApiClient().submitEvidence(session.user, session.token, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  })
}

export function useReviewSubmission() {
  const session = useRequiredSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewInput) => getApiClient().review(session.user, session.token, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  })
}

export function useInitiatePayout() {
  const session = useRequiredSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: number) =>
      getApiClient().initiatePayout(session.user, session.token, submissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  })
}

export function useSaveWorkflow() {
  const session = useRequiredSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (steps: WorkflowStep[]) =>
      getApiClient().saveWorkflow(session.user, session.token, steps),
    onSuccess: (steps) => {
      queryClient.setQueryData(queryKeys.workflow, steps)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useRealtimeSync() {
  const session = useRequiredSession()
  const queryClient = useQueryClient()

  useEffect(
    () =>
      getApiClient().subscribe(session, (event) => {
        if (event === 'workflow.updated') {
          void queryClient.invalidateQueries({ queryKey: queryKeys.workflow })
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      }),
    [queryClient, session],
  )
}
