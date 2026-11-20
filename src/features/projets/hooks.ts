import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import {
	creerProjet,
	listerMethodes,
	listerProjets,
	modifierProjet,
	supprimerProjet,
	type Projet,
	type ProjetEntree,
	type ProjetModification,
} from './api'
import { getProjetActifIri, setProjetActifIri, subscribeProjetActif } from './projet-actif'

export const projetKeys = {
	liste: ['projets'] as const,
	methodes: ['methodes'] as const,
}

export function useProjets() {
	return useQuery({
		queryKey: projetKeys.liste,
		queryFn: ({ signal }) => listerProjets(signal),
	})
}

export function useMethodes() {
	return useQuery({
		queryKey: projetKeys.methodes,
		queryFn: ({ signal }) => listerMethodes(signal),
		staleTime: Infinity,
	})
}

/**
 * Projet actif : celui choisi dans la barre latérale, sinon le plus récemment modifié.
 * Renvoie null tant que la liste n'est pas chargée ou si l'auteur n'a aucun projet.
 */
export function useProjetActif(): { projet: Projet | null; choisir: (iri: Iri) => void } {
	const iriChoisi = useSyncExternalStore(subscribeProjetActif, getProjetActifIri)
	const { data: projets } = useProjets()

	const projet = projets?.find((p) => p['@id'] === iriChoisi) ?? plusRecent(projets) ?? null
	return { projet, choisir: setProjetActifIri }
}

function plusRecent(projets: Projet[] | undefined): Projet | undefined {
	if (!projets?.length) return undefined
	return [...projets].sort((a, b) => (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? ''))[0]
}

export function useCreerProjet() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (entree: ProjetEntree) => creerProjet(entree),
		onSuccess: (projet) => {
			queryClient.setQueryData<Projet[]>(projetKeys.liste, (liste) => [projet, ...(liste ?? [])])
			setProjetActifIri(projet['@id'])
		},
	})
}

export function useModifierProjet() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: Iri; modification: ProjetModification }) => modifierProjet(iri, modification),
		onSuccess: (projet) => {
			queryClient.setQueryData<Projet[]>(projetKeys.liste, (liste) =>
				liste?.map((p) => (p['@id'] === projet['@id'] ? projet : p)),
			)
		},
	})
}

export function useSupprimerProjet() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (iri: Iri) => supprimerProjet(iri),
		onSuccess: (_, iri) => {
			queryClient.setQueryData<Projet[]>(projetKeys.liste, (liste) => liste?.filter((p) => p['@id'] !== iri))
			if (getProjetActifIri() === iri) setProjetActifIri(null)
		},
	})
}
