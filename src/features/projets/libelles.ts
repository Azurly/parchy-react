import type { Projet, StatutProjet } from './api'

export const statutsProjet: { valeur: StatutProjet; libelle: string }[] = [
	{ valeur: 'conception', libelle: 'En conception' },
	{ valeur: 'redaction', libelle: 'En rédaction' },
	{ valeur: 'relecture', libelle: 'En relecture' },
	{ valeur: 'termine', libelle: 'Terminé' },
]

export function libelleStatut(statut: Projet['statut']): string {
	return statutsProjet.find((s) => s.valeur === statut)?.libelle ?? 'En conception'
}

export function initiales(titre: string): string {
	return titre.trim().slice(0, 2).toUpperCase() || '··'
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export function formaterDate(iso: string | null | undefined): string {
	if (!iso) return ''
	const date = new Date(iso)
	return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
}

/** « Mis à jour il y a 2 h », « hier », etc. */
export function depuis(iso: string | null | undefined): string {
	if (!iso) return ''
	const ecart = Date.now() - new Date(iso).getTime()
	if (Number.isNaN(ecart)) return ''
	const minutes = Math.round(ecart / 60000)
	if (minutes < 1) return 'à l’instant'
	if (minutes < 60) return `il y a ${minutes} min`
	const heures = Math.round(minutes / 60)
	if (heures < 24) return `il y a ${heures} h`
	const jours = Math.round(heures / 24)
	if (jours === 1) return 'hier'
	if (jours < 30) return `il y a ${jours} jours`
	return `le ${formaterDate(iso)}`
}
