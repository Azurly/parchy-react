import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionExpiredMessage } from '@/shared/api/errors'
import { clearToken, getLastClearReason, getToken, setToken, subscribeToken } from '@/shared/api/token'
import { connexion, inscription, lireMoi, modifierUtilisateur, type ConnexionEntree, type InscriptionEntree, type Utilisateur, type UtilisateurModification } from './api'

export const authKeys = {
	moi: ['auth', 'moi'] as const,
}

/** Jeton courant ; le composant se met à jour à la connexion, à la déconnexion ou sur un 401. */
export function useSessionToken(): string | null {
	return useSyncExternalStore(subscribeToken, getToken)
}

/** Message à afficher sur l'écran de connexion quand la session a expiré. */
export function useSessionEndMessage(): string {
	const token = useSessionToken()
	return token === null && getLastClearReason() === 'expired' ? sessionExpiredMessage : ''
}

export function useCurrentUser() {
	const token = useSessionToken()
	return useQuery({
		queryKey: authKeys.moi,
		queryFn: ({ signal }) => lireMoi(signal),
		enabled: token !== null,
		staleTime: 5 * 60 * 1000,
	})
}

export function useLogin() {
	return useMutation({
		mutationFn: (entree: ConnexionEntree) => connexion(entree),
		onSuccess: (token) => setToken(token),
	})
}

/** Inscription puis connexion automatique avec les mêmes identifiants. */
export function useRegister() {
	return useMutation({
		mutationFn: async (entree: InscriptionEntree) => {
			await inscription(entree)
			return connexion({ email: entree.email, motDePasse: entree.motDePasse ?? '' })
		},
		onSuccess: (token) => setToken(token),
	})
}

export function useLogout() {
	return () => clearToken('logout')
}

export function useModifierProfil() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: string; modification: UtilisateurModification }) => modifierUtilisateur(iri, modification),
		onSuccess: (utilisateur: Utilisateur) => queryClient.setQueryData(authKeys.moi, utilisateur),
	})
}
