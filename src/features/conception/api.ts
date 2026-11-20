import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

export type Methode = Schemas['Methode.jsonld-methode.lecture']
export type MethodeEtape = Schemas['MethodeEtape.jsonld-methode.lecture']

/** Fiche saisie à l'étape « personnages » de la méthode du flocon. */
export interface FichePersonnage {
	nom: string
	objectif?: string
	motivation?: string
	conflit?: string
	apprentissage?: string
}

/**
 * Contenu libre d'une réponse (objet JSON côté back).
 * Convention des données du back : `{ texte }` pour la plupart des étapes,
 * `{ personnages: [...] }` pour l'étape « personnages ». Les autres clés sont conservées.
 */
export interface ContenuReponse {
	texte?: string
	personnages?: FichePersonnage[]
	[cle: string]: unknown
}

export type ReponseEtape = Omit<Schemas['ReponseEtape.jsonld-reponse.lecture_horodatage'], 'contenu'> & { contenu: ContenuReponse }

function normaliser(reponse: Schemas['ReponseEtape.jsonld-reponse.lecture_horodatage']): ReponseEtape {
	const contenu = reponse.contenu && typeof reponse.contenu === 'object' && !Array.isArray(reponse.contenu) ? reponse.contenu : {}
	return { ...reponse, contenu: contenu as ContenuReponse }
}

/** GET /api/methodes/{id} : la méthode et ses étapes (public). */
export async function lireMethode(iri: Iri, signal?: AbortSignal): Promise<Methode> {
	const methode = await apiRequest<Methode>(iri, { signal })
	return { ...methode, etapes: [...(methode.etapes ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) }
}

/** GET /api/reponse_etapes?projet=… : réponses du projet, toutes méthodes confondues. */
export async function listerReponses(projet: Iri, signal?: AbortSignal): Promise<ReponseEtape[]> {
	return (await apiRequestAll<Schemas['ReponseEtape.jsonld-reponse.lecture_horodatage']>('/reponse_etapes', { query: { projet }, signal })).map(normaliser)
}

/** POST : une seule réponse par projet et par étape (sinon 422). */
export async function creerReponse(projet: Iri, etape: Iri, contenu: ContenuReponse): Promise<ReponseEtape> {
	return normaliser(await apiRequest('/reponse_etapes', { method: 'POST', body: { projet, etape, contenu } }))
}

/** PATCH : le contenu complet est renvoyé à chaque fois. */
export async function modifierReponse(iri: Iri, contenu: ContenuReponse): Promise<ReponseEtape> {
	return normaliser(await apiRequest(iri, { method: 'PATCH', body: { contenu } }))
}

export async function supprimerReponse(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}
