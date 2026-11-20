/**
 * Sessions d'écriture automatiques.
 *
 * - Une session s'ouvre à la première frappe dans une scène d'un projet.
 * - Chaque enregistrement de scène ajoute le solde de mots (net : peut être négatif).
 * - Elle est envoyée au back 5 s après le dernier enregistrement (POST la première fois, PATCH ensuite).
 * - Après 30 min sans frappe, ou en changeant de projet, la suivante est une nouvelle session.
 * - La session en cours est gardée dans le navigateur : un rechargement ne la coupe pas,
 *   et des mots comptés hors ligne partent au retour du réseau.
 */

import { queryClient } from '@/shared/api/query-client'
import { getToken, getTokenSubject, subscribeToken } from '@/shared/api/token'
import { creerSession, modifierSession } from './api'

const cleStockage = 'parchy.sessionEcriture'
const delaiInactivite = 30 * 60 * 1000
const delaiEnvoi = 5000

interface SessionLocale {
	proprietaire: string
	projet: string
	iri?: string
	debut: string
	motsAjoutes: number
	derniereActivite: number
	/** Mots déjà confirmés par le back (pour savoir s'il reste quelque chose à envoyer). */
	motsEnvoyes: number
}

let session: SessionLocale | null = lire()
let file: Promise<void> = Promise.resolve()
let minuteur: number | undefined

function lire(): SessionLocale | null {
	try {
		const brut = window.localStorage.getItem(cleStockage)
		return brut ? (JSON.parse(brut) as SessionLocale) : null
	} catch {
		return null
	}
}

function sauver(): void {
	try {
		if (session) window.localStorage.setItem(cleStockage, JSON.stringify(session))
		else window.localStorage.removeItem(cleStockage)
	} catch {
		// Stockage indisponible : la session reste en mémoire.
	}
}

/** Les appels au back passent un par un (évite deux POST pour la même session). */
function enchainer(tache: () => Promise<void>): Promise<void> {
	file = file.then(tache, tache)
	return file
}

async function synchroniser(s: SessionLocale): Promise<void> {
	if (s.proprietaire !== getTokenSubject()) return
	const motsAEnvoyer = s.motsAjoutes
	const fin = new Date(s.derniereActivite).toISOString()
	try {
		if (!s.iri) {
			const creee = await creerSession({ projet: s.projet, debut: s.debut, fin, motsAjoutes: motsAEnvoyer })
			s.iri = creee['@id']
		} else {
			await modifierSession(s.iri, { fin, motsAjoutes: motsAEnvoyer })
		}
		s.motsEnvoyes = motsAEnvoyer
		if (s === session) sauver()
		void queryClient.invalidateQueries({ queryKey: ['sessions', s.projet] })
	} catch {
		// Réseau coupé ou session expirée : nouvel essai au prochain enregistrement ou au retour du réseau.
	}
}

function aEnvoyer(s: SessionLocale | null): s is SessionLocale {
	return Boolean(s && (s.motsAjoutes !== s.motsEnvoyes || !s.iri) && s.motsAjoutes !== 0)
}

/** Envoie la session en cours si elle a changé. */
export function envoyerSession(): Promise<void> {
	window.clearTimeout(minuteur)
	minuteur = undefined
	const s = session
	if (!aEnvoyer(s)) return Promise.resolve()
	return enchainer(() => synchroniser(s))
}

/** L'auteur écrit dans une scène de ce projet. */
export function signalerActivite(projet: string): void {
	const proprietaire = getTokenSubject()
	if (!proprietaire) return
	const maintenant = Date.now()

	const continuer = session
		&& session.proprietaire === proprietaire
		&& session.projet === projet
		&& maintenant - session.derniereActivite < delaiInactivite

	if (continuer) {
		session!.derniereActivite = maintenant
	} else {
		// La session précédente se termine : on envoie ce qui lui reste, puis on en ouvre une nouvelle.
		const precedente = session
		if (aEnvoyer(precedente) && precedente.proprietaire === proprietaire) void enchainer(() => synchroniser(precedente))
		session = { proprietaire, projet, debut: new Date(maintenant).toISOString(), motsAjoutes: 0, motsEnvoyes: 0, derniereActivite: maintenant }
	}
	sauver()
}

/** Une scène du projet vient d'être enregistrée : `delta` = mots après − mots avant. */
export function enregistrerMots(projet: string, delta: number): void {
	if (!delta) return
	signalerActivite(projet)
	if (!session) return
	session.motsAjoutes += delta
	sauver()
	window.clearTimeout(minuteur)
	minuteur = window.setTimeout(() => void envoyerSession(), delaiEnvoi)
}

window.addEventListener('online', () => void envoyerSession())
window.addEventListener('pagehide', () => void envoyerSession())

// Connexion : on envoie ce qu'une session précédente de ce compte n'avait pas pu envoyer.
subscribeToken(() => {
	if (getToken()) void envoyerSession()
	else window.clearTimeout(minuteur)
})

if (getToken()) void envoyerSession()
