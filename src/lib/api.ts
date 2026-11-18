export interface Utilisateur {
	email: string
	nomAffichage: string
}

export interface Projet {
	'@id': string
	titre: string
	genre: string | null
	statut: string
}

interface Collection<T> {
	member: T[]
}

interface ApiErrorBody {
	detail?: string
	message?: string
	'hydra:description'?: string
}

export class ApiError extends Error {
	readonly status: number

	constructor(message: string, status: number) {
		super(message)
		this.status = status
		this.name = 'ApiError'
	}
}

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
const tokenStorageKey = 'parchy.jwt'

async function request<T>(
	path: string,
	options: {
		method?: string
		body?: unknown
		token?: string
		contentType?: string
	} = {},
): Promise<T> {
	const headers = new Headers({ Accept: 'application/ld+json, application/json' })
	if (options.body !== undefined) {
		headers.set('Content-Type', options.contentType ?? 'application/ld+json')
	}
	if (options.token) {
		headers.set('Authorization', `Bearer ${options.token}`)
	}

	const response = await fetch(`${apiUrl}${path}`, {
		method: options.method ?? 'GET',
		headers,
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	})
	const responseText = await response.text()
	let payload: unknown

	if (responseText) {
		try {
			payload = JSON.parse(responseText)
		} catch {
			throw new ApiError(`Réponse illisible de l’API (HTTP ${response.status}).`, response.status)
		}
	}

	if (!response.ok) {
		const body = payload as ApiErrorBody | undefined
		const message = body?.['hydra:description'] ?? body?.detail ?? body?.message
		throw new ApiError(
			message ?? `La requête a échoué (HTTP ${response.status}).`,
			response.status,
		)
	}

	return payload as T
}

export function getStoredToken(): string | null {
	return window.localStorage.getItem(tokenStorageKey)
}

export function storeToken(token: string): void {
	window.localStorage.setItem(tokenStorageKey, token)
}

export function clearStoredToken(): void {
	window.localStorage.removeItem(tokenStorageKey)
}

export async function register(email: string, password: string, name: string): Promise<void> {
	await request('/utilisateurs', {
		method: 'POST',
		body: { email, motDePasse: password, nomAffichage: name },
	})
}

export async function login(email: string, password: string): Promise<string> {
	const result = await request<{ token: string }>('/connexion', {
		method: 'POST',
		contentType: 'application/json',
		body: { email, motDePasse: password },
	})

	return result.token
}

export function getCurrentUser(token: string): Promise<Utilisateur> {
	return request('/moi', { token })
}

export async function getProjects(token: string): Promise<Projet[]> {
	const result = await request<Collection<Projet>>('/projets', { token })

	return result.member
}

export function createProject(token: string, title: string): Promise<Projet> {
	return request('/projets', {
		method: 'POST',
		token,
		body: { titre: title },
	})
}

export function getApiErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message
	}
	if (error instanceof TypeError) {
		return `Impossible de joindre l’API (${apiUrl}). Vérifiez qu’elle est démarrée et que VITE_API_URL est correct.`
	}

	return 'Une erreur inattendue est survenue pendant la communication avec l’API.'
}
