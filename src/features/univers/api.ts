import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

export type Entite = Schemas['Entite.jsonld-entite.lecture_horodatage']
export type TypeEntite = Entite['type']
/** Champs libres propres au type (âge, apparence, climat…). */
export type Donnees = Record<string, unknown>
export type Relation = Schemas['RelationEntite.jsonld-relation.lecture']
/**
 * À la lecture, `entites` contient des objets `{ '@id' }` ; à l'écriture, des IRI.
 * On normalise en IRI pour le reste du front.
 */
export type Evenement = Omit<Schemas['Evenement.jsonld-evenement.lecture_horodatage'], 'entites'> & { entites: Iri[] }

export interface EntiteEntree {
	projet: Iri
	type: TypeEntite
	nom: string
	resume?: string | null
	donnees?: Donnees
}
export type EntiteModification = Partial<Pick<EntiteEntree, 'nom' | 'resume' | 'donnees'>>

export interface RelationEntree {
	source: Iri
	cible: Iri
	typeRelation: string
	description?: string | null
}

export interface EvenementEntree {
	projet: Iri
	titre: string
	description?: string | null
	libelleDate?: string | null
	position: number
	entites?: Iri[]
}
export type EvenementModification = Partial<Omit<EvenementEntree, 'projet'>>

// --- Fiches ---

/** GET /api/entites?projet=… : personnages, lieux, objets, organisations, concepts du projet. */
export function listerEntites(projet: Iri, signal?: AbortSignal): Promise<Entite[]> {
	return apiRequestAll<Entite>('/entites', { query: { projet }, signal })
}

export function creerEntite(entree: EntiteEntree): Promise<Entite> {
	return apiRequest<Entite>('/entites', { method: 'POST', body: entree })
}

export function modifierEntite(iri: Iri, modification: EntiteModification): Promise<Entite> {
	return apiRequest<Entite>(iri, { method: 'PATCH', body: modification })
}

/** Supprime aussi ses relations, ses présences dans les scènes et ses liens aux événements (cascade). */
export async function supprimerEntite(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

// --- Relations ---

export function listerRelations(projet: Iri, signal?: AbortSignal): Promise<Relation[]> {
	return apiRequestAll<Relation>('/relation_entites', { query: { projet }, signal })
}

/** 422 si la fiche est reliée à elle-même ou si la relation existe déjà. */
export function creerRelation(entree: RelationEntree): Promise<Relation> {
	return apiRequest<Relation>('/relation_entites', { method: 'POST', body: entree })
}

export async function supprimerRelation(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

// --- Chronologie ---

function normaliserEvenement(evenement: Schemas['Evenement.jsonld-evenement.lecture_horodatage']): Evenement {
	const entites = (evenement.entites ?? []).map((e: unknown) => (typeof e === 'string' ? e : (e as { '@id': string })['@id']))
	return { ...evenement, entites }
}

/** GET /api/evenements?projet=… : repères chronologiques, triés par position. */
export async function listerEvenements(projet: Iri, signal?: AbortSignal): Promise<Evenement[]> {
	const evenements = await apiRequestAll<Schemas['Evenement.jsonld-evenement.lecture_horodatage']>('/evenements', { query: { projet }, signal })
	return evenements.map(normaliserEvenement).sort((a, b) => a.position - b.position)
}

/** La position est unique par projet et ≥ 1 ; le back ne renumérote pas. */
export async function creerEvenement(entree: EvenementEntree): Promise<Evenement> {
	return normaliserEvenement(await apiRequest('/evenements', { method: 'POST', body: entree }))
}

export async function modifierEvenement(iri: Iri, modification: EvenementModification): Promise<Evenement> {
	return normaliserEvenement(await apiRequest(iri, { method: 'PATCH', body: modification }))
}

export async function supprimerEvenement(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

/**
 * Échange la place de deux événements. La position étant unique par projet et chaque
 * requête validée séparément, on passe par une position libre : 3 PATCH successifs.
 */
export async function echangerEvenements(a: Evenement, b: Evenement, positionLibre: number): Promise<void> {
	await modifierEvenement(a['@id'], { position: positionLibre })
	await modifierEvenement(b['@id'], { position: a.position })
	await modifierEvenement(a['@id'], { position: b.position })
}
