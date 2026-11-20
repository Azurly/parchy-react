/**
 * Synchronisation du texte des scènes (voir docs/API-CONTRAT.md, « Synchronisation des scènes »).
 *
 * L'éditeur n'écrit que dans ce module : `modifier()` à chaque frappe.
 * 1. Le texte est écrit dans IndexedDB (brouillon) quelques centaines de ms après la frappe.
 * 2. Il est envoyé à l'API 2,5 s après la dernière frappe, avec la version serveur de départ.
 * 3. Une seule requête à la fois par scène : une frappe pendant l'envoi relance un envoi après la réponse.
 * 4. 409 : on relit la scène et on attend le choix de l'auteur (`resoudreConflit`).
 * 5. Hors ligne : le brouillon reste dans IndexedDB et part au retour du réseau ou à la reconnexion.
 */

import type { JSONContent } from '@tiptap/react'
import { enregistrerContenu, lireScene, type Scene, type SceneDetail } from '@/features/scenes/api'
import { ApiError, NetworkError, getErrorMessage } from '@/shared/api/errors'
import { getToken, getTokenSubject, subscribeToken } from '@/shared/api/token'
import { db, type Brouillon } from './db'

const delaiEcritureLocale = 300
const delaiEnvoi = 2500
const delaiReessai = 15000

// --- État observable, par scène ---

export type StatutSync = 'synchronise' | 'en_attente' | 'envoi' | 'hors_ligne' | 'conflit' | 'erreur'

export interface EtatSync {
	statut: StatutSync
	message?: string
	/** Version serveur relue après un 409. */
	serveur?: SceneDetail
}

const synchronise: EtatSync = { statut: 'synchronise' }
const etats = new Map<string, EtatSync>()
const abonnes = new Set<() => void>()

function setEtat(iri: string, etat: EtatSync): void {
	if (etat.statut === 'synchronise') etats.delete(iri)
	else etats.set(iri, etat)
	for (const abonne of abonnes) abonne()
}

export function getEtat(iri: string): EtatSync {
	return etats.get(iri) ?? synchronise
}

/** État le plus important parmi toutes les scènes (pour le pied de page). */
export function getEtatGlobal(): StatutSync {
	const statuts = new Set([...etats.values()].map((e) => e.statut))
	for (const statut of ['conflit', 'erreur', 'hors_ligne', 'envoi', 'en_attente'] as const) {
		if (statuts.has(statut)) return statut
	}
	return 'synchronise'
}

export function abonner(abonne: () => void): () => void {
	abonnes.add(abonne)
	return () => abonnes.delete(abonne)
}

// --- Notifications vers les features (cache des requêtes, éditeur) ---

export interface Ecouteur {
	/** L'auteur vient de modifier le texte de la scène (sert au suivi des sessions d'écriture). */
	modifie?: (iri: string) => void
	/** Le serveur a accepté ce texte : `scene` porte la nouvelle version et le nombre de mots. */
	enregistre?: (scene: Scene, contenu: JSONContent) => void
	/** Le texte de la scène a été remplacé par celui du serveur (conflit, restauration). */
	remplace?: (scene: SceneDetail) => void
}

const ecouteurs = new Set<Ecouteur>()

export function ecouter(ecouteur: Ecouteur): () => void {
	ecouteurs.add(ecouteur)
	return () => ecouteurs.delete(ecouteur)
}

/** À appeler quand le texte d'une scène change côté serveur hors de ce module (restauration). */
export function remplacerDepuisServeur(scene: SceneDetail): void {
	for (const e of ecouteurs) e.remplace?.(scene)
}

// --- Écriture locale ---

/** Texte pas encore écrit dans IndexedDB ; le compte est noté à la frappe (il peut se déconnecter entre-temps). */
const ecrituresEnAttente = new Map<string, { contenu: JSONContent; versionSiNouveau: number; proprietaire: string }>()
const minuteursLocaux = new Map<string, number>()
const minuteursEnvoi = new Map<string, number>()
const envoisEnCours = new Set<string>()
const aRelancer = new Set<string>()

/** Appelé par l'éditeur à chaque modification du texte. */
export function modifier(iri: string, contenu: JSONContent, versionServeur: number): void {
	const proprietaire = getTokenSubject()
	if (!proprietaire) return
	ecrituresEnAttente.set(iri, { contenu, versionSiNouveau: versionServeur, proprietaire })
	for (const e of ecouteurs) e.modifie?.(iri)
	if (getEtat(iri).statut !== 'conflit') setEtat(iri, { statut: 'en_attente' })

	window.clearTimeout(minuteursLocaux.get(iri))
	minuteursLocaux.set(iri, window.setTimeout(() => void ecrireLocal(iri), delaiEcritureLocale))

	window.clearTimeout(minuteursEnvoi.get(iri))
	minuteursEnvoi.set(iri, window.setTimeout(() => void envoyer(iri), delaiEnvoi))
}

async function ecrireLocal(iri: string): Promise<void> {
	window.clearTimeout(minuteursLocaux.get(iri))
	minuteursLocaux.delete(iri)
	const attente = ecrituresEnAttente.get(iri)
	if (!attente) return
	ecrituresEnAttente.delete(iri)

	// Transaction : ne pas écraser une versionBase mise à jour par un envoi qui vient d'aboutir.
	await db.transaction('rw', db.brouillons, async () => {
		const existant = await db.brouillons.get(iri)
		await db.brouillons.put({
			sceneIri: iri,
			proprietaire: attente.proprietaire,
			contenu: attente.contenu,
			versionBase: existant?.versionBase ?? attente.versionSiNouveau,
			modifieLe: Date.now(),
			conflit: existant?.conflit ?? false,
		})
	})
}

/** Brouillon local d'une scène pour le compte connecté (texte plus récent que celui du serveur). */
export async function lireBrouillon(iri: string): Promise<Brouillon | undefined> {
	await ecrireLocal(iri)
	const brouillon = await db.brouillons.get(iri)
	return brouillon && brouillon.proprietaire === getTokenSubject() ? brouillon : undefined
}

/** true si le texte de la scène est entièrement enregistré sur le serveur. */
export async function estSynchronisee(iri: string): Promise<boolean> {
	return !ecrituresEnAttente.has(iri) && !minuteursEnvoi.has(iri) && !envoisEnCours.has(iri) && !(await lireBrouillon(iri))
}

// --- Envoi ---

export async function envoyer(iri: string): Promise<void> {
	window.clearTimeout(minuteursEnvoi.get(iri))
	minuteursEnvoi.delete(iri)

	if (envoisEnCours.has(iri)) {
		aRelancer.add(iri)
		return
	}
	envoisEnCours.add(iri)

	try {
		const brouillon = await lireBrouillon(iri)
		if (!brouillon) {
			if (getEtat(iri).statut === 'en_attente') setEtat(iri, synchronise)
			return
		}
		// Conflit en cours : on attend le choix de l'auteur.
		if (brouillon.conflit && getEtat(iri).statut === 'conflit') return
		if (!navigator.onLine) {
			setEtat(iri, { statut: 'hors_ligne' })
			return
		}
		await pousser(brouillon, brouillon.versionBase, false)
	} finally {
		envoisEnCours.delete(iri)
		if (aRelancer.delete(iri)) void envoyer(iri)
	}
}

async function pousser(brouillon: Brouillon, version: number, resolutionConflit: boolean): Promise<void> {
	const iri = brouillon.sceneIri
	setEtat(iri, { statut: 'envoi' })

	try {
		const scene = await enregistrerContenu(iri, brouillon.contenu, version, resolutionConflit)

		const resteAEnvoyer = await db.transaction('rw', db.brouillons, async () => {
			const actuel = await db.brouillons.get(iri)
			if (!actuel) return false
			if (actuel.modifieLe === brouillon.modifieLe) {
				await db.brouillons.delete(iri)
				return false
			}
			// L'auteur a continué d'écrire pendant l'envoi : le prochain envoi part de la nouvelle version.
			await db.brouillons.update(iri, { versionBase: scene.version, conflit: false })
			return true
		})

		for (const e of ecouteurs) e.enregistre?.(scene, brouillon.contenu)

		if (resteAEnvoyer || ecrituresEnAttente.has(iri)) {
			setEtat(iri, { statut: 'en_attente' })
			if (!minuteursEnvoi.has(iri)) aRelancer.add(iri)
		} else {
			setEtat(iri, synchronise)
		}
	} catch (error) {
		await traiterEchec(iri, error)
	}
}

async function traiterEchec(iri: string, error: unknown): Promise<void> {
	if (error instanceof ApiError && error.status === 409) {
		try {
			const serveur = await lireScene(iri)
			await db.brouillons.update(iri, { conflit: true })
			setEtat(iri, { statut: 'conflit', serveur })
		} catch (lecture) {
			setEtat(iri, { statut: 'erreur', message: getErrorMessage(lecture) })
		}
	} else if (error instanceof NetworkError) {
		setEtat(iri, { statut: 'hors_ligne' })
		planifierReessai()
	} else if (error instanceof ApiError && error.status === 401) {
		// Session expirée : le brouillon reste local et repartira après reconnexion.
		setEtat(iri, { statut: 'en_attente' })
	} else if (error instanceof ApiError && error.status === 404) {
		await db.brouillons.delete(iri)
		setEtat(iri, { statut: 'erreur', message: 'Cette scène n’existe plus.' })
	} else {
		setEtat(iri, { statut: 'erreur', message: getErrorMessage(error) })
	}
}

// --- Conflit ---

/**
 * « garder celle du serveur » : le brouillon local est abandonné.
 * « garder ma version » : renvoi avec la version serveur et `resolutionConflit: true`
 * (le texte serveur écrasé est archivé par le back, origine `conflit`).
 */
export async function resoudreConflit(iri: string, choix: 'serveur' | 'local'): Promise<void> {
	const etat = getEtat(iri)
	if (etat.statut !== 'conflit' || !etat.serveur) return
	const serveur = etat.serveur

	if (choix === 'serveur') {
		ecrituresEnAttente.delete(iri)
		window.clearTimeout(minuteursEnvoi.get(iri))
		minuteursEnvoi.delete(iri)
		await db.brouillons.delete(iri)
		setEtat(iri, synchronise)
		remplacerDepuisServeur(serveur)
		return
	}

	if (envoisEnCours.has(iri)) return
	envoisEnCours.add(iri)
	try {
		const brouillon = await lireBrouillon(iri)
		if (!brouillon) {
			setEtat(iri, synchronise)
			return
		}
		await pousser(brouillon, serveur.version ?? brouillon.versionBase, true)
	} finally {
		envoisEnCours.delete(iri)
		if (aRelancer.delete(iri)) void envoyer(iri)
	}
}

// --- Reprise : retour du réseau, reconnexion, ouverture de l'application ---

let minuteurReessai: number | undefined

function planifierReessai(): void {
	if (minuteurReessai !== undefined) return
	minuteurReessai = window.setTimeout(() => {
		minuteurReessai = undefined
		void rejouer()
	}, delaiReessai)
}

/** Renvoie tous les brouillons du compte connecté. */
export async function rejouer(): Promise<void> {
	const proprietaire = getTokenSubject()
	if (!proprietaire) return
	const brouillons = await db.brouillons.where('proprietaire').equals(proprietaire).toArray()
	for (const brouillon of brouillons) {
		if (getEtat(brouillon.sceneIri).statut === 'conflit') continue
		setEtat(brouillon.sceneIri, { statut: 'en_attente' })
		void envoyer(brouillon.sceneIri)
	}
}

/** Écrit tout de suite dans IndexedDB ce qui attend encore (fermeture de l'onglet). */
function viderEcrituresLocales(): void {
	for (const iri of [...ecrituresEnAttente.keys()]) void ecrireLocal(iri)
}

window.addEventListener('online', () => void rejouer())
window.addEventListener('pagehide', viderEcrituresLocales)
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') viderEcrituresLocales()
})

subscribeToken(() => {
	if (getToken()) {
		void rejouer()
		return
	}
	// Déconnexion : les brouillons restent dans IndexedDB pour ce compte, l'état en mémoire est oublié.
	viderEcrituresLocales()
	for (const minuteur of minuteursEnvoi.values()) window.clearTimeout(minuteur)
	minuteursEnvoi.clear()
	etats.clear()
	for (const abonne of abonnes) abonne()
})

if (getToken()) void rejouer()
