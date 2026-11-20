import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import {
	creerEntite,
	creerEvenement,
	creerRelation,
	echangerEvenements,
	listerEntites,
	listerEvenements,
	listerRelations,
	modifierEntite,
	modifierEvenement,
	supprimerEntite,
	supprimerEvenement,
	supprimerRelation,
	type EntiteEntree,
	type EntiteModification,
	type Evenement,
	type EvenementEntree,
	type EvenementModification,
	type RelationEntree,
} from './api'

export const universKeys = {
	entites: (projet: Iri) => ['entites', projet] as const,
	relations: (projet: Iri) => ['relations', projet] as const,
	evenements: (projet: Iri) => ['evenements', projet] as const,
}

export function useEntites(projet: Iri | undefined) {
	return useQuery({
		queryKey: universKeys.entites(projet ?? ''),
		queryFn: ({ signal }) => listerEntites(projet!, signal),
		enabled: Boolean(projet),
	})
}

export function useRelations(projet: Iri | undefined) {
	return useQuery({
		queryKey: universKeys.relations(projet ?? ''),
		queryFn: ({ signal }) => listerRelations(projet!, signal),
		enabled: Boolean(projet),
	})
}

export function useEvenements(projet: Iri | undefined) {
	return useQuery({
		queryKey: universKeys.evenements(projet ?? ''),
		queryFn: ({ signal }) => listerEvenements(projet!, signal),
		enabled: Boolean(projet),
	})
}

function useRafraichir(projet: Iri) {
	const client = useQueryClient()
	return (...cles: ('entites' | 'relations' | 'evenements' | 'scenes')[]) =>
		Promise.all(cles.map((cle) => client.invalidateQueries({ queryKey: [cle, projet] })))
}

export function useCreerEntite(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (entree: Omit<EntiteEntree, 'projet'>) => creerEntite({ ...entree, projet }),
		onSuccess: () => rafraichir('entites'),
	})
}

export function useModifierEntite(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: Iri; modification: EntiteModification }) => modifierEntite(iri, modification),
		onSuccess: () => rafraichir('entites', 'evenements'),
	})
}

/** La suppression d'une fiche retire aussi ses relations, présences et liens aux événements. */
export function useSupprimerEntite(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (iri: Iri) => supprimerEntite(iri),
		onSuccess: () => rafraichir('entites', 'relations', 'evenements', 'scenes'),
	})
}

export function useCreerRelation(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (entree: RelationEntree) => creerRelation(entree),
		onSuccess: () => rafraichir('relations'),
	})
}

export function useSupprimerRelation(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (iri: Iri) => supprimerRelation(iri),
		onSuccess: () => rafraichir('relations'),
	})
}

export function useCreerEvenement(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (entree: Omit<EvenementEntree, 'projet'>) => creerEvenement({ ...entree, projet }),
		onSuccess: () => rafraichir('evenements'),
	})
}

export function useModifierEvenement(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: Iri; modification: EvenementModification }) => modifierEvenement(iri, modification),
		onSuccess: () => rafraichir('evenements'),
	})
}

export function useSupprimerEvenement(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: (iri: Iri) => supprimerEvenement(iri),
		onSuccess: () => rafraichir('evenements'),
	})
}

export function useEchangerEvenements(projet: Iri) {
	const rafraichir = useRafraichir(projet)
	return useMutation({
		mutationFn: ({ a, b, positionLibre }: { a: Evenement; b: Evenement; positionLibre: number }) => echangerEvenements(a, b, positionLibre),
		// Même en cas d'échec au milieu, on relit l'ordre réel.
		onSettled: () => rafraichir('evenements'),
	})
}
