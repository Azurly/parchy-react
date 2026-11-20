import type { Scene } from '@/features/scenes/api'
import type { Entite, TypeEntite } from './api'

export const typesEntite: { valeur: TypeEntite; libelle: string; pluriel: string }[] = [
	{ valeur: 'personnage', libelle: 'Personnage', pluriel: 'Personnages' },
	{ valeur: 'lieu', libelle: 'Lieu', pluriel: 'Lieux' },
	{ valeur: 'objet', libelle: 'Objet', pluriel: 'Objets' },
	{ valeur: 'organisation', libelle: 'Organisation', pluriel: 'Organisations' },
	{ valeur: 'concept', libelle: 'Concept', pluriel: 'Concepts' },
]

export function libelleType(type: TypeEntite): string {
	return typesEntite.find((t) => t.valeur === type)?.libelle ?? type
}

/** Détails libres de la fiche (`donnees`) : âge, trait, apparence… */
export function detailsFiche(entite: Entite): string {
	const donnees = (entite.donnees ?? {}) as Record<string, unknown>
	const morceaux: string[] = []
	if (typeof donnees.age === 'number') morceaux.push(`${donnees.age} ans`)
	for (const cle of ['trait', 'apparence']) {
		if (typeof donnees[cle] === 'string' && donnees[cle]) morceaux.push(donnees[cle] as string)
	}
	return morceaux.join(' · ')
}

export function initialesNom(nom: string): string {
	return nom.split(/\s+/).filter(Boolean).map((mot) => mot[0]).slice(0, 2).join('').toUpperCase()
}

/** Nombre de scènes où l'entité est présente ou mentionnée. */
export function nombreScenes(entite: Entite, scenes: Scene[] | undefined): number {
	return (scenes ?? []).filter((scene) => scene.presences?.some((p) => p.entite === entite['@id'])).length
}

/** Détails proposés par défaut à la création d'une fiche, selon son type (clés de `donnees`). */
const champsParType: Record<TypeEntite, string[]> = {
	personnage: ['age', 'apparence', 'trait', 'secret'],
	lieu: ['emplacement', 'ambiance', 'climat'],
	objet: ['origine', 'pouvoir', 'proprietaire'],
	organisation: ['but', 'chef', 'membres'],
	concept: ['regles', 'limites'],
}

export function champsSuggeres(type: TypeEntite): string[] {
	return champsParType[type] ?? []
}

const libellesChamps: Record<string, string> = {
	age: 'Âge',
	apparence: 'Apparence',
	trait: 'Trait de caractère',
	secret: 'Secret',
	emplacement: 'Emplacement',
	ambiance: 'Ambiance',
	climat: 'Climat',
	origine: 'Origine',
	pouvoir: 'Pouvoir',
	proprietaire: 'Propriétaire',
	but: 'But',
	chef: 'Chef',
	membres: 'Membres',
	regles: 'Règles',
	limites: 'Limites',
	objectif: 'Objectif',
	motivation: 'Motivation',
	conflit: 'Conflit',
	apprentissage: 'Ce qu’il apprend',
}

/** Libellé lisible d'une clé connue ; une clé inconnue est affichée telle quelle. */
export function libelleChamp(cle: string): string {
	return libellesChamps[cle] ?? cle
}
