import { apiRequest, apiRequestAll, apiTelecharger } from '@/shared/api/client'
import type { Iri, Schemas } from '@/shared/api/types'

/** `statut` est un simple texte dans l'OpenAPI : valeurs prises dans docs/API-CONTRAT.md. */
export type StatutExport = 'en_attente' | 'en_cours' | 'termine' | 'echoue'
export type Export = Omit<Schemas['Export.jsonld-export.lecture'], 'statut'> & { statut?: StatutExport }
export type FormatExport = NonNullable<Export['format']>
export type ExportEntree = Schemas['Export-export.creation']

/** GET /api/exports?projet=… : historique, du plus récent au plus ancien. */
export function listerExports(projet: Iri, signal?: AbortSignal): Promise<Export[]> {
	return apiRequestAll<Export>('/exports', { query: { projet }, signal })
}

/** POST /api/exports : 202, la génération se fait en arrière-plan (statut « en_attente »). */
export function creerExport(entree: ExportEntree): Promise<Export> {
	return apiRequest<Export>('/exports', { method: 'POST', body: entree })
}

/** Supprime l'export et son fichier. */
export async function supprimerExport(iri: Iri): Promise<void> {
	await apiRequest<void>(iri, { method: 'DELETE' })
}

/**
 * GET lienTelechargement (même jeton) : le fichier ne s'ouvre pas par un simple lien.
 * 409 si la génération n'est pas finie, 410 après expiration (7 jours).
 */
export function telechargerFichier(lien: string): Promise<Blob> {
	return apiTelecharger(lien, {
		messages: {
			409: 'Ce fichier n’est pas encore prêt.',
			410: 'Ce fichier a expiré : relancez un export.',
		},
	})
}
