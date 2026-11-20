import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

export type Projet = Schemas['Projet.jsonld-projet.lecture_horodatage']
export type ProjetEntree = Schemas['Projet-projet.ecriture']
/** JSON Merge Patch : tous les champs sont facultatifs. */
export type ProjetModification = Partial<Schemas['Projet-projet.ecriture.jsonMergePatch']>
export type StatutProjet = NonNullable<Projet['statut']>
export type Methode = Schemas['Methode.jsonld-methode.lecture']

/** GET /api/projets, toutes pages confondues. */
export function listerProjets(signal?: AbortSignal): Promise<Projet[]> {
	return apiRequestAll<Projet>('/projets', { signal })
}

/** GET /api/projets/{id} : accepte l'IRI du projet. */
export function lireProjet(iri: Iri, signal?: AbortSignal): Promise<Projet> {
	return apiRequest<Projet>(iri, { signal })
}

export function creerProjet(entree: ProjetEntree): Promise<Projet> {
	return apiRequest<Projet>('/projets', { method: 'POST', body: entree })
}

export function modifierProjet(iri: Iri, modification: ProjetModification): Promise<Projet> {
	return apiRequest<Projet>(iri, { method: 'PATCH', body: modification })
}

/** DELETE /api/projets/{id} : met le projet à la corbeille (suppression logique côté back). */
export async function supprimerProjet(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

/** GET /api/methodes : méthodes d'écriture proposées à la création d'un projet. */
export function listerMethodes(signal?: AbortSignal): Promise<Methode[]> {
	return apiRequestAll<Methode>('/methodes', { signal })
}
