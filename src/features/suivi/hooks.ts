import { useQuery } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import { listerSessions } from './api'

export function useSessions(projet: Iri | undefined) {
	return useQuery({
		queryKey: ['sessions', projet ?? ''],
		queryFn: ({ signal }) => listerSessions(projet!, signal),
		enabled: Boolean(projet),
	})
}
