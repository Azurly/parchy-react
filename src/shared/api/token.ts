/**
 * Stockage du jeton JWT.
 * Seul endroit qui sait où le jeton est conservé : pour passer plus tard
 * à un cookie ou à sessionStorage, il suffit de modifier ce fichier.
 */

const storageKey = 'parchy.jwt'

type Listener = () => void
const listeners = new Set<Listener>()

let currentToken: string | null = readFromStorage()

function readFromStorage(): string | null {
	try {
		return window.localStorage.getItem(storageKey)
	} catch {
		return null
	}
}

function notify(): void {
	for (const listener of listeners) listener()
}

export function getToken(): string | null {
	return currentToken
}

export function setToken(token: string): void {
	lastClearReason = null
	currentToken = token
	try {
		window.localStorage.setItem(storageKey, token)
	} catch {
		// Stockage indisponible (navigation privée) : le jeton reste en mémoire.
	}
	notify()
}

/** Pourquoi le dernier jeton a été supprimé : pour afficher « session expirée » ou non. */
export type ClearReason = 'logout' | 'expired'
let lastClearReason: ClearReason | null = null

export function getLastClearReason(): ClearReason | null {
	return lastClearReason
}

export function clearToken(reason: ClearReason = 'logout'): void {
	if (currentToken === null) return
	lastClearReason = reason
	currentToken = null
	try {
		window.localStorage.removeItem(storageKey)
	} catch {
		// Rien à faire.
	}
	notify()
}

export function subscribeToken(listener: Listener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

// Déconnexion ou connexion dans un autre onglet.
window.addEventListener('storage', (event) => {
	if (event.key !== storageKey) return
	currentToken = event.newValue
	notify()
})

/**
 * Identifiant du compte connecté, lu dans le jeton (claim `email` côté back).
 * Sert à cloisonner les données locales (brouillons hors ligne) entre comptes.
 * Le jeton n'est pas vérifié ici : c'est le rôle du back.
 */
export function getTokenSubject(): string | null {
	if (!currentToken) return null
	try {
		const payload = currentToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
		const octets = Uint8Array.from(window.atob(payload), (c) => c.charCodeAt(0))
		const claims = JSON.parse(new TextDecoder().decode(octets)) as { email?: string; username?: string }
		return claims.email ?? claims.username ?? null
	} catch {
		return null
	}
}
