import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import { creerChapitre, listerChapitres, modifierChapitre, supprimerChapitre, type ChapitreModification } from './api'

export const chapitreKeys = {
	duProjet: (projet: Iri) => ['chapitres', projet] as const,
	tous: ['chapitres'] as const,
}

export function useChapitres(projet: Iri | undefined) {
	return useQuery({
		queryKey: chapitreKeys.duProjet(projet ?? ''),
		queryFn: ({ signal }) => listerChapitres(projet!, signal),
		enabled: Boolean(projet),
	})
}

/** Après une modification, les positions et compteurs de tout le projet peuvent changer. */
function useRafraichirManuscrit() {
	const queryClient = useQueryClient()
	return (projet: Iri) => Promise.all([
		queryClient.invalidateQueries({ queryKey: chapitreKeys.duProjet(projet) }),
		queryClient.invalidateQueries({ queryKey: ['scenes', projet] }),
	])
}

export function useCreerChapitre(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	return useMutation({
		mutationFn: ({ titre, position }: { titre: string; position?: number }) => creerChapitre(projet, titre, position),
		onSuccess: () => rafraichir(projet),
	})
}

export function useModifierChapitre(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: Iri; modification: ChapitreModification }) => modifierChapitre(iri, modification),
		onSuccess: () => rafraichir(projet),
	})
}

/** Supprime le chapitre et ses scènes. */
export function useSupprimerChapitre(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	return useMutation({
		mutationFn: (iri: Iri) => supprimerChapitre(iri),
		onSuccess: () => rafraichir(projet),
	})
}
