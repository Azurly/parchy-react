import { apiRequest } from '@/shared/api/client'
import { invalidCredentialsMessage } from '@/shared/api/errors'
import type { Schemas } from '@/shared/api/types'

export type Utilisateur = Schemas['Utilisateur.jsonld-utilisateur.lecture_horodatage']
export type InscriptionEntree = Schemas['Utilisateur-utilisateur.creation_validation.Default_utilisateur.creation']

export interface ConnexionEntree {
	email: string
	motDePasse: string
}

/** POST /api/connexion (public, JSON simple) : renvoie le jeton JWT. */
export async function connexion(entree: ConnexionEntree): Promise<string> {
	const { token } = await apiRequest<{ token: string }>('/connexion', {
		method: 'POST',
		auth: false,
		contentType: 'application/json',
		body: entree,
		messages: { 401: invalidCredentialsMessage },
	})
	return token
}

/** POST /api/utilisateurs (public) : crée le compte et l'abonnement gratuit. */
export function inscription(entree: InscriptionEntree): Promise<Utilisateur> {
	return apiRequest<Utilisateur>('/utilisateurs', {
		method: 'POST',
		auth: false,
		body: entree,
	})
}

/** GET /api/moi : utilisateur courant, avec son abonnement. */
export function lireMoi(signal?: AbortSignal): Promise<Utilisateur> {
	return apiRequest<Utilisateur>('/moi', { signal })
}

export type UtilisateurModification = Partial<Schemas['Utilisateur-utilisateur.modification.jsonMergePatch']>

/** PATCH /api/utilisateurs/{id} : nom affiché (ou mot de passe). */
export function modifierUtilisateur(iri: string, modification: UtilisateurModification): Promise<Utilisateur> {
	return apiRequest<Utilisateur>(iri, { method: 'PATCH', body: modification })
}
