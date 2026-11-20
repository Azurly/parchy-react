import { useSyncExternalStore } from 'react'

/** Scène ouverte dans le manuscrit (partagée entre le Plan et le Manuscrit, le temps de la session). */
let sceneActive: string | null = null
const abonnes = new Set<() => void>()

function abonner(abonne: () => void): () => void {
	abonnes.add(abonne)
	return () => abonnes.delete(abonne)
}

export function ouvrirScene(iri: string | null): void {
	sceneActive = iri
	for (const abonne of abonnes) abonne()
}

export function useSceneActive(): string | null {
	return useSyncExternalStore(abonner, () => sceneActive)
}
