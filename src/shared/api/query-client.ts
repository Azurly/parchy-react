import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'
import { getToken, subscribeToken } from './token'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Une erreur 4xx ne se corrige pas en réessayant.
			retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
			refetchOnWindowFocus: false,
		},
	},
})

// Déconnexion ou session expirée : on oublie les données du compte précédent.
subscribeToken(() => {
	if (getToken() === null) queryClient.clear()
})
