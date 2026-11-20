import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

export type Chapitre = Schemas['Chapitre.jsonld-chapitre.lecture']
/** JSON Merge Patch : tous les champs sont facultatifs (l'OpenAPI les marque à tort comme obligatoires). */
export type ChapitreModification = Partial<Schemas['Chapitre-chapitre.ecriture.jsonMergePatch']>

/** GET /api/chapitres?projet=… : chapitres du projet, triés par position. */
export async function listerChapitres(projet: Iri, signal?: AbortSignal): Promise<Chapitre[]> {
	const chapitres = await apiRequestAll<Chapitre>('/chapitres', { query: { projet }, signal })
	return chapitres.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

/** POST /api/chapitres : sans position, le chapitre est ajouté à la fin. */
export function creerChapitre(projet: Iri, titre: string, position?: number): Promise<Chapitre> {
	return apiRequest<Chapitre>('/chapitres', { method: 'POST', body: { projet, titre, position } })
}

/** PATCH : titre ou position (les autres chapitres sont renumérotés par le back). */
export function modifierChapitre(iri: Iri, modification: ChapitreModification): Promise<Chapitre> {
	return apiRequest<Chapitre>(iri, { method: 'PATCH', body: modification })
}

export async function supprimerChapitre(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}
