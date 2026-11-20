import type { JSONContent } from '@tiptap/react'
import { apiRequest, apiRequestAll } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

/**
 * `contenu` est un document TipTap (objet), même si l'OpenAPI le décrit comme un tableau :
 * on ne suit pas schema.d.ts sur ce champ (voir docs/API-CONTRAT.md).
 */
type AvecContenu<T> = Omit<T, 'contenu'> & { contenu: JSONContent }

export type Scene = Schemas['Scene.jsonld-scene.lecture']
export type SceneDetail = AvecContenu<Schemas['Scene.jsonld-scene.lecture_scene.detail']>
/** JSON Merge Patch : tous les champs sont facultatifs (l'OpenAPI les marque à tort comme obligatoires). */
export type SceneModification = Partial<Schemas['Scene-scene.ecriture.jsonMergePatch']>
export type StatutScene = NonNullable<Scene['statut']>
export type SceneVersion = Schemas['SceneVersion.jsonld-version.lecture']
export type SceneVersionDetail = AvecContenu<Schemas['SceneVersion.jsonld-version.lecture_version.detail']>

export const documentVide: JSONContent = { type: 'doc', content: [] }

/** Le back peut renvoyer `[]` ou `null` pour un texte vide : on rétablit un document TipTap. */
export function normaliserContenu(contenu: unknown): JSONContent {
	if (contenu && typeof contenu === 'object' && !Array.isArray(contenu) && (contenu as JSONContent).type === 'doc') {
		const doc = contenu as JSONContent
		return { ...doc, content: Array.isArray(doc.content) ? doc.content : [] }
	}
	return documentVide
}

function avecContenu<T extends { contenu?: unknown }>(ressource: T): AvecContenu<T> {
	return { ...ressource, contenu: normaliserContenu(ressource.contenu) }
}

/** GET /api/scenes?projet=… : toutes les scènes du projet, sans le texte, dans l'ordre du manuscrit. */
export function listerScenes(projet: Iri, signal?: AbortSignal): Promise<Scene[]> {
	return apiRequestAll<Scene>('/scenes', { query: { projet }, signal })
}

/** GET /api/scenes/{id} : avec le texte (`contenu`) et le numéro de `version`. */
export async function lireScene(iri: Iri, signal?: AbortSignal): Promise<SceneDetail> {
	return avecContenu(await apiRequest<Schemas['Scene.jsonld-scene.lecture_scene.detail']>(iri, { signal }))
}

export function creerScene(chapitre: Iri, titre: string, position?: number): Promise<Scene> {
	return apiRequest<Scene>('/scenes', { method: 'POST', body: { chapitre, titre, position } })
}

/** PATCH : métadonnées et emplacement, sans verrou de version. */
export function modifierScene(iri: Iri, modification: SceneModification): Promise<Scene> {
	return apiRequest<Scene>(iri, { method: 'PATCH', body: modification })
}

export async function supprimerScene(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

/**
 * PUT /api/scenes/{id}/contenu (verrou optimiste).
 * Réservé à src/sync : l'éditeur n'appelle jamais cette fonction directement.
 */
export function enregistrerContenu(iri: Iri, contenu: JSONContent, version: number, resolutionConflit = false): Promise<Scene> {
	return apiRequest<Scene>(`${iri}/contenu`, {
		method: 'PUT',
		body: { contenu, version, resolutionConflit },
		messages: { 409: 'Cette scène a été modifiée ailleurs.' },
	})
}

// --- Historique des versions ---

export function listerVersions(scene: Iri, signal?: AbortSignal): Promise<SceneVersion[]> {
	return apiRequestAll<SceneVersion>(`${scene}/versions`, { signal })
}

export async function lireVersion(iri: Iri, signal?: AbortSignal): Promise<SceneVersionDetail> {
	return avecContenu(await apiRequest<Schemas['SceneVersion.jsonld-version.lecture_version.detail']>(iri, { signal }))
}

/** POST /api/scenes/{id}/versions : instantané manuel du texte courant (sans corps). */
export function creerInstantane(scene: Iri): Promise<SceneVersion> {
	return apiRequest<SceneVersion>(`${scene}/versions`, { method: 'POST' })
}

/** POST /api/scene_versions/{id}/restaurer : `version` = version courante de la scène (409 si périmée). */
export async function restaurerVersion(iri: Iri, versionCourante: number): Promise<SceneDetail> {
	return avecContenu(await apiRequest<Schemas['SceneVersion.SceneRessource.jsonld-scene.lecture_scene.detail']>(`${iri}/restaurer`, {
		method: 'POST',
		body: { version: versionCourante },
		messages: { 409: 'La scène a changé entre-temps : rechargez-la avant de restaurer.' },
	}))
}
