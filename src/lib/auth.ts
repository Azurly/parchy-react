const tokenStorageKey = 'parchy.jwt'
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
const loginUrl = import.meta.env.VITE_AUTH_ENDPOINT || `${apiBaseUrl}/login`

type AuthPayload = {
	token?: unknown
	access_token?: unknown
	jwt?: unknown
	message?: unknown
}

export function isValidJwt(token: string | null): token is string {
	if (!token) return false

	const parts = token.split('.')
	if (parts.length !== 3 || parts.some((part) => !part)) return false

	try {
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
		return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now()
	} catch {
		return false
	}
}

export function getStoredJwt(): string | null {
	const token = window.localStorage.getItem(tokenStorageKey)
	if (isValidJwt(token)) return token
	window.localStorage.removeItem(tokenStorageKey)
	return null
}

export function clearStoredJwt() {
	window.localStorage.removeItem(tokenStorageKey)
}

export async function loginWithPassword(email: string, password: string): Promise<string> {
	const response = await fetch(loginUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ email, password }),
	})

	const payload = await response.json().catch(() => null) as AuthPayload | null
	if (!response.ok) {
		throw new Error(typeof payload?.message === 'string' ? payload.message : 'Identifiants invalides ou service indisponible.')
	}

	const token = payload?.token ?? payload?.access_token ?? payload?.jwt
	if (typeof token !== 'string' || !isValidJwt(token)) {
		throw new Error('La réponse du serveur ne contient pas de JWT valide.')
	}

	window.localStorage.setItem(tokenStorageKey, token)
	return token
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	const token = getStoredJwt()
	if (!token) {
		window.location.assign('/')
		throw new Error('Authentification requise.')
	}

	const headers = new Headers(init.headers)
	headers.set('Authorization', `Bearer ${token}`)
	const response = await fetch(input, { ...init, headers })
	if (response.status === 401) {
		clearStoredJwt()
		window.location.assign('/')
	}
	return response
}
