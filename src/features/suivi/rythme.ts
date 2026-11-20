import type { SessionEcriture } from './api'

const lettres = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const unJour = 24 * 60 * 60 * 1000

/** Clé de jour locale (AAAA-MM-JJ) : une session compte pour le jour où elle a commencé. */
function cleJour(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function debutDeSemaine(maintenant: Date): Date {
	const jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
	const decalage = (jour.getDay() + 6) % 7 // lundi = 0
	jour.setDate(jour.getDate() - decalage)
	return jour
}

export interface JourRythme {
	lettre: string
	mots: number
	aujourdhui: boolean
}

export interface Rythme {
	jours: JourRythme[]
	totalSemaine: number
	/** Jours consécutifs avec au moins un mot, jusqu'à aujourd'hui (ou hier si rien encore aujourd'hui). */
	serie: number
}

export function calculerRythme(sessions: SessionEcriture[], maintenant = new Date()): Rythme {
	const motsParJour = new Map<string, number>()
	for (const session of sessions) {
		const cle = cleJour(new Date(session.debut))
		motsParJour.set(cle, (motsParJour.get(cle) ?? 0) + (session.motsAjoutes ?? 0))
	}

	const lundi = debutDeSemaine(maintenant)
	const aujourdhui = cleJour(maintenant)
	const jours = lettres.map((lettre, index) => {
		const date = new Date(lundi)
		date.setDate(lundi.getDate() + index)
		const cle = cleJour(date)
		return { lettre, mots: motsParJour.get(cle) ?? 0, aujourdhui: cle === aujourdhui }
	})

	let serie = 0
	let curseur = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
	if (!motsParJour.get(cleJour(curseur))) curseur = new Date(curseur.getTime() - unJour)
	while ((motsParJour.get(cleJour(curseur)) ?? 0) > 0) {
		serie++
		curseur = new Date(curseur.getTime() - unJour)
	}

	return { jours, totalSemaine: jours.reduce((total, jour) => total + jour.mots, 0), serie }
}

/**
 * Objectif de la semaine déduit du projet : mots restants répartis sur les semaines
 * qui restent avant la date cible. null si le projet n'a pas d'objectif ou de date cible.
 */
export function objectifHebdomadaire(objectifMots: number | null | undefined, dateCible: string | null | undefined, motsEcrits: number, maintenant = new Date()): number | null {
	if (!objectifMots || !dateCible) return null
	const restant = objectifMots - motsEcrits
	if (restant <= 0) return null
	const semaines = Math.max(1, Math.ceil((new Date(dateCible).getTime() - maintenant.getTime()) / (7 * unJour)))
	return Math.ceil(restant / semaines)
}

export interface JourStat {
	date: Date
	cle: string
	mots: number
	minutes: number
}

/** Mots (nets) et minutes d'écriture par jour, sur les `nombreJours` derniers jours (aujourd'hui inclus). */
export function joursRecents(sessions: SessionEcriture[], nombreJours = 30, maintenant = new Date()): JourStat[] {
	const parJour = new Map<string, { mots: number; minutes: number }>()
	for (const session of sessions) {
		const debut = new Date(session.debut)
		const cle = cleJour(debut)
		const minutes = session.fin ? Math.max(0, (new Date(session.fin).getTime() - debut.getTime()) / 60000) : 0
		const actuel = parJour.get(cle) ?? { mots: 0, minutes: 0 }
		parJour.set(cle, { mots: actuel.mots + (session.motsAjoutes ?? 0), minutes: actuel.minutes + minutes })
	}
	const jours: JourStat[] = []
	for (let i = nombreJours - 1; i >= 0; i--) {
		const date = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - i)
		const cle = cleJour(date)
		jours.push({ date, cle, mots: parJour.get(cle)?.mots ?? 0, minutes: Math.round(parJour.get(cle)?.minutes ?? 0) })
	}
	return jours
}

/** Plus longue suite de jours consécutifs avec des mots écrits, sur tout l'historique. */
export function meilleureSerie(sessions: SessionEcriture[]): number {
	// Même règle que la série en cours : un jour compte si son solde de mots est positif.
	const parJour = new Map<string, number>()
	for (const s of sessions) {
		const cle = cleJour(new Date(s.debut))
		parJour.set(cle, (parJour.get(cle) ?? 0) + (s.motsAjoutes ?? 0))
	}
	const jours = [...parJour].filter(([, mots]) => mots > 0).map(([cle]) => cle).sort()
	let meilleure = 0
	let courante = 0
	let precedent: Date | null = null
	for (const cle of jours) {
		const [a, m, j] = cle.split('-').map(Number)
		const date = new Date(a, m - 1, j)
		courante = precedent && Math.round((date.getTime() - precedent.getTime()) / unJour) === 1 ? courante + 1 : 1
		meilleure = Math.max(meilleure, courante)
		precedent = date
	}
	return meilleure
}

/**
 * Date à laquelle l'objectif serait atteint au rythme moyen des 14 derniers jours.
 * null si pas d'objectif, objectif atteint ou rythme nul.
 */
export function projection(objectifMots: number | null | undefined, motsEcrits: number, moyenneParJour: number, maintenant = new Date()): Date | null {
	if (!objectifMots || motsEcrits >= objectifMots || moyenneParJour <= 0) return null
	const joursRestants = Math.ceil((objectifMots - motsEcrits) / moyenneParJour)
	return new Date(maintenant.getTime() + joursRestants * unJour)
}
