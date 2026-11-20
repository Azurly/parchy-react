import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import { creerExport, listerExports, supprimerExport, telechargerFichier, type Export, type ExportEntree } from './api'

const exportKeys = {
	duProjet: (projet: Iri) => ['exports', projet] as const,
}

const delaiInterrogation = 3000

function enCours(exports: Export[] | undefined): boolean {
	return Boolean(exports?.some((e) => e.statut === 'en_attente' || e.statut === 'en_cours'))
}

/** Historique des exports ; interrogé toutes les 3 s tant qu'une génération est en cours. */
export function useExports(projet: Iri | undefined) {
	return useQuery({
		queryKey: exportKeys.duProjet(projet ?? ''),
		queryFn: ({ signal }) => listerExports(projet!, signal),
		enabled: Boolean(projet),
		refetchInterval: (query) => (enCours(query.state.data) ? delaiInterrogation : false),
	})
}

export function useCreerExport(projet: Iri) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (entree: Omit<ExportEntree, 'projet'>) => creerExport({ ...entree, projet }),
		onSuccess: (cree) => {
			// Ajouté tout de suite en tête : l'interrogation démarre aussitôt.
			queryClient.setQueryData<Export[]>(exportKeys.duProjet(projet), (liste) => [cree, ...(liste ?? []).filter((e) => e['@id'] !== cree['@id'])])
		},
	})
}

export function useSupprimerExport(projet: Iri) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (iri: Iri) => supprimerExport(iri),
		onSuccess: (_, iri) => queryClient.setQueryData<Export[]>(exportKeys.duProjet(projet), (liste) => liste?.filter((e) => e['@id'] !== iri)),
	})
}

/** Télécharge le fichier puis le propose à l'enregistrement sous `nomFichier`. */
export function useTelechargerExport(projet: Iri) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ lien, nomFichier }: { lien: string; nomFichier: string }) => {
			const fichier = await telechargerFichier(lien)
			const url = URL.createObjectURL(fichier)
			const lienTemporaire = document.createElement('a')
			lienTemporaire.href = url
			lienTemporaire.download = nomFichier
			document.body.append(lienTemporaire)
			lienTemporaire.click()
			lienTemporaire.remove()
			window.setTimeout(() => URL.revokeObjectURL(url), 1000)
		},
		// Fichier expiré entre-temps : on relit l'historique pour retirer le lien.
		onError: () => queryClient.invalidateQueries({ queryKey: exportKeys.duProjet(projet) }),
	})
}
