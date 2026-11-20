import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

export type SessionEcriture = Schemas['SessionEcriture.jsonld-session.lecture']

/** GET /api/session_ecritures?projet=… : sessions d'écriture du projet. */
export function listerSessions(projet: Iri, signal?: AbortSignal): Promise<SessionEcriture[]> {
	return apiRequestAll<SessionEcriture>('/session_ecritures', { query: { projet }, signal })
}

export interface SessionEntree {
	projet: Iri
	debut: string
	fin?: string | null
	motsAjoutes?: number
}

/** POST /api/session_ecritures : le nombre de mots est net (il peut être négatif). */
export function creerSession(entree: SessionEntree): Promise<SessionEcriture> {
	return apiRequest<SessionEcriture>('/session_ecritures', { method: 'POST', body: entree })
}

/** PATCH : fin et mots ajoutés (pas de suppression possible côté back). */
export function modifierSession(iri: Iri, modification: { fin?: string | null; motsAjoutes?: number }): Promise<SessionEcriture> {
	return apiRequest<SessionEcriture>(iri, { method: 'PATCH', body: modification })
}
