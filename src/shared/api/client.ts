/**
 * Client HTTP unique de l'application.
 * - ajoute le jeton (Authorization: Bearer) ;
 * - choisit le Content-Type selon la méthode (voir docs/API-CONTRAT.md) ;
 * - transforme les erreurs en ApiError, avec message français et erreurs par champ ;
 * - sur 401 d'une requête authentifiée : supprime le jeton (retour à la connexion).
 *
 * Les features n'appellent jamais fetch : elles passent par ce module depuis leur api.ts.
 */

import { ApiError, NetworkError, messageForStatus, parseViolations } from './errors'
import { clearToken, getToken } from './token'

export const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')

/** Origine du serveur, pour résoudre les IRI (`/api/projets/…`) et les liens `view.next`. */
const apiOrigin = new URL(apiUrl, window.location.href).origin

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
	method?: Method
	body?: unknown
	/** false pour les routes publiques (connexion, inscription). */
	auth?: boolean
	/** Remplace le Content-Type déduit de la méthode. */
	contentType?: string
	/** Paramètres de requête ; les valeurs undefined sont ignorées. */
	query?: Record<string, string | number | undefined>
	signal?: AbortSignal
	/**
	 * Message propre à cet appel pour certains codes, prioritaire sur le message générique.
	 * Exemple : `{ 401: invalidCredentialsMessage }` pour la connexion.
	 */
	messages?: Partial<Record<number, string>>
}

function defaultContentType(method: Method): string {
	return method === 'PATCH' ? 'application/merge-patch+json' : 'application/ld+json'
}

/**
 * Accepte un chemin relatif à VITE_API_URL (`/projets`), un IRI (`/api/projets/…`)
 * ou une URL absolue.
 */
function buildUrl(path: string, query?: RequestOptions['query']): URL {
	const url = /^https?:\/\//.test(path)
		? new URL(path)
		: path.startsWith('/api/')
			? new URL(path, apiOrigin)
			: new URL(apiUrl + path)

	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined) url.searchParams.set(key, String(value))
	}
	return url
}

export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return executer<T>(path, options, 'json')
}

/**
 * Télécharge un fichier protégé par le jeton (export) : renvoie son contenu binaire.
 * Mêmes règles que apiRequest pour le jeton, le 401 et les messages d'erreur.
 */
export function apiTelecharger(path: string, options: Pick<RequestOptions, 'signal' | 'messages'> = {}): Promise<Blob> {
	return executer<Blob>(path, options, 'blob')
}

async function executer<T>(path: string, options: RequestOptions, lecture: 'json' | 'blob'): Promise<T> {
	const method = options.method ?? 'GET'
	const auth = options.auth ?? true
	const headers = new Headers({ Accept: lecture === 'blob' ? '*/*' : 'application/ld+json, application/json' })

	if (options.body !== undefined) {
		headers.set('Content-Type', options.contentType ?? defaultContentType(method))
	}

	const token = auth ? getToken() : null
	if (token) headers.set('Authorization', `Bearer ${token}`)

	let response: Response
	try {
		response = await fetch(buildUrl(path, options.query), {
			method,
			headers,
			body: options.body === undefined ? undefined : JSON.stringify(options.body),
			signal: options.signal,
		})
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') throw error
		throw new NetworkError()
	}

	if (lecture === 'blob' && response.ok) return (await response.blob()) as T

	const text = await response.text()
	let payload: unknown
	if (text) {
		try {
			payload = JSON.parse(text)
		} catch {
			payload = undefined
		}
	}

	if (!response.ok) {
		// Jeton absent, expiré ou invalide : pas de renouvellement en v1.
		if (response.status === 401 && auth) clearToken('expired')

		const fieldErrors = response.status === 422 ? parseViolations(payload) : {}
		const message = options.messages?.[response.status] ?? messageForStatus(response.status)
		throw new ApiError(response.status, message, fieldErrors)
	}

	return payload as T
}

/** Collection Hydra paginée, telle que renvoyée par les routes GET de liste. */
export interface HydraCollection<T> {
	member: T[]
	totalItems?: number
	view?: { next?: string | null }
}

/** Lit toutes les pages d'une collection en suivant `view.next`. */
export async function apiRequestAll<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T[]> {
	const items: T[] = []
	let page: HydraCollection<T> = await apiRequest<HydraCollection<T>>(path, options)
	items.push(...page.member)

	while (page.view?.next) {
		page = await apiRequest<HydraCollection<T>>(page.view.next, { ...options, query: undefined })
		items.push(...page.member)
	}
	return items
}
