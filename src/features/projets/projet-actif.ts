/**
 * Projet sélectionné dans la barre latérale.
 * Préférence propre à ce navigateur : elle n'a pas besoin d'être enregistrée côté serveur.
 */

import { getToken, subscribeToken } from '@/shared/api/token'

const storageKey = 'parchy.projetActif'

type Listener = () => void
const listeners = new Set<Listener>()

let iriActif: string | null = lire()

function lire(): string | null {
	try {
		return window.localStorage.getItem(storageKey)
	} catch {
		return null
	}
}

export function getProjetActifIri(): string | null {
	return iriActif
}

export function setProjetActifIri(iri: string | null): void {
	iriActif = iri
	try {
		if (iri) window.localStorage.setItem(storageKey, iri)
		else window.localStorage.removeItem(storageKey)
	} catch {
		// Stockage indisponible : la sélection reste en mémoire.
	}
	for (const listener of listeners) listener()
}

export function subscribeProjetActif(listener: Listener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

// Déconnexion : le compte suivant ne doit pas hériter du projet choisi.
subscribeToken(() => {
	if (getToken() === null && iriActif !== null) setProjetActifIri(null)
})
