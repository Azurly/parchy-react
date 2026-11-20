import type { Scene, StatutScene } from './api'

export const statutsScene: { valeur: StatutScene; libelle: string }[] = [
	{ valeur: 'plan', libelle: 'À écrire' },
	{ valeur: 'brouillon', libelle: 'Brouillon' },
	{ valeur: 'relu', libelle: 'Relue' },
	{ valeur: 'final', libelle: 'Finale' },
]

export function libelleStatutScene(statut: Scene['statut']): string {
	return statutsScene.find((s) => s.valeur === statut)?.libelle ?? 'À écrire'
}

const nombre = new Intl.NumberFormat('fr-FR')

export function formaterMots(mots: number | undefined): string {
	const n = mots ?? 0
	return `${nombre.format(n)} mot${n > 1 ? 's' : ''}`
}

/** Regroupe les scènes par chapitre, triées par position. */
export function scenesParChapitre(scenes: Scene[] | undefined): Map<string, Scene[]> {
	const groupes = new Map<string, Scene[]>()
	for (const scene of scenes ?? []) {
		if (!scene.chapitre) continue
		const liste = groupes.get(scene.chapitre) ?? []
		liste.push(scene)
		groupes.set(scene.chapitre, liste)
	}
	for (const liste of groupes.values()) liste.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
	return groupes
}
