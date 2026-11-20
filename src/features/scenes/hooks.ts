import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActionImpossible } from '@/shared/api/errors'
import { queryClient } from '@/shared/api/query-client'
import type { Iri } from '@/shared/api/types'
import * as sync from '@/sync'
import { chapitreKeys } from '@/features/chapitres/hooks'
import { enregistrerMots, signalerActivite } from '@/features/suivi/session'
import {
	creerInstantane,
	creerScene,
	listerScenes,
	listerVersions,
	lireScene,
	modifierScene,
	restaurerVersion,
	supprimerScene,
	type Scene,
	type SceneDetail,
	type SceneModification,
} from './api'

export const sceneKeys = {
	duProjet: (projet: Iri) => ['scenes', projet] as const,
	detail: (scene: Iri) => ['scene', scene] as const,
	versions: (scene: Iri) => ['versions', scene] as const,
}

// --- Cache mis à jour par la synchronisation ---

function appliquerScene(scene: Scene | SceneDetail): void {
	const iri = scene['@id']
	queryClient.setQueryData<SceneDetail>(sceneKeys.detail(iri), (detail) => detail && { ...detail, ...scene, contenu: 'contenu' in scene ? scene.contenu : detail.contenu })
	if (scene.projet) {
		queryClient.setQueryData<Scene[]>(sceneKeys.duProjet(scene.projet), (liste) => liste?.map((s) => (s['@id'] === iri ? { ...s, nombreMots: scene.nombreMots, version: scene.version, misAJourLe: scene.misAJourLe } : s)))
		// Les totaux de mots des chapitres changent avec le texte.
		void queryClient.invalidateQueries({ queryKey: chapitreKeys.duProjet(scene.projet) })
	}
}

sync.ecouter({
	// Suivi : une frappe ouvre ou prolonge la session d'écriture du projet de la scène.
	modifie: (iri) => {
		const projet = queryClient.getQueryData<SceneDetail>(sceneKeys.detail(iri))?.projet
		if (projet) signalerActivite(projet)
	},
	enregistre: (scene, contenu) => {
		// Solde de mots de cet enregistrement, calculé avant de mettre le cache à jour.
		const avant = queryClient.getQueryData<SceneDetail>(sceneKeys.detail(scene['@id']))?.nombreMots
		appliquerScene({ ...scene, contenu } as SceneDetail)
		if (scene.projet && avant !== undefined && scene.nombreMots !== undefined) enregistrerMots(scene.projet, scene.nombreMots - avant)
	},
	remplace: (scene) => appliquerScene(scene),
})

// --- Lecture ---

/** Toutes les scènes du projet (sans texte), dans l'ordre du manuscrit. */
export function useScenes(projet: Iri | undefined) {
	return useQuery({
		queryKey: sceneKeys.duProjet(projet ?? ''),
		queryFn: ({ signal }) => listerScenes(projet!, signal),
		enabled: Boolean(projet),
	})
}

/** Une scène avec son texte. Le texte n'est jamais rechargé en arrière-plan pendant l'écriture. */
export function useScene(iri: Iri | undefined) {
	return useQuery({
		queryKey: sceneKeys.detail(iri ?? ''),
		queryFn: ({ signal }) => lireScene(iri!, signal),
		enabled: Boolean(iri),
		staleTime: Infinity,
	})
}

/** État de synchronisation d'une scène (enregistré, en attente, hors ligne, conflit…). */
export function useEtatSync(iri: Iri): sync.EtatSync {
	return useSyncExternalStore(sync.abonner, () => sync.getEtat(iri))
}

export function useEtatGlobalSync(): sync.StatutSync {
	return useSyncExternalStore(sync.abonner, sync.getEtatGlobal)
}

// --- Écriture des métadonnées et de l'emplacement ---

function useRafraichirManuscrit() {
	const client = useQueryClient()
	return (projet: Iri) => Promise.all([
		client.invalidateQueries({ queryKey: sceneKeys.duProjet(projet) }),
		client.invalidateQueries({ queryKey: chapitreKeys.duProjet(projet) }),
	])
}

export function useCreerScene(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	return useMutation({
		mutationFn: ({ chapitre, titre }: { chapitre: Iri; titre: string }) => creerScene(chapitre, titre),
		onSuccess: () => rafraichir(projet),
	})
}

/** Titre, statut, résumé, position, chapitre… (PATCH sans verrou de version). */
export function useModifierScene(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	return useMutation({
		mutationFn: ({ iri, modification }: { iri: Iri; modification: SceneModification }) => modifierScene(iri, modification),
		onSuccess: (scene) => {
			appliquerScene(scene)
			return rafraichir(projet)
		},
	})
}

export function useSupprimerScene(projet: Iri) {
	const rafraichir = useRafraichirManuscrit()
	const client = useQueryClient()
	return useMutation({
		mutationFn: (iri: Iri) => supprimerScene(iri),
		onSuccess: (_, iri) => {
			client.removeQueries({ queryKey: sceneKeys.detail(iri) })
			return rafraichir(projet)
		},
	})
}

// --- Historique des versions ---

export function useVersions(scene: Iri, actif: boolean) {
	return useQuery({
		queryKey: sceneKeys.versions(scene),
		queryFn: ({ signal }) => listerVersions(scene, signal),
		enabled: actif,
	})
}

export function useCreerInstantane(scene: Iri) {
	const client = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			// L'instantané archive le texte du serveur : on envoie d'abord ce qui attend.
			await sync.envoyer(scene)
			return creerInstantane(scene)
		},
		onSuccess: () => client.invalidateQueries({ queryKey: sceneKeys.versions(scene) }),
	})
}

export function useRestaurerVersion(scene: Iri) {
	const client = useQueryClient()
	return useMutation({
		mutationFn: async (versionIri: Iri) => {
			if (!(await sync.estSynchronisee(scene))) {
				throw new ActionImpossible('Attendez que vos dernières modifications soient enregistrées avant de restaurer une version.')
			}
			const courante = client.getQueryData<SceneDetail>(sceneKeys.detail(scene))?.version ?? 1
			return restaurerVersion(versionIri, courante)
		},
		onSuccess: (restauree) => {
			sync.remplacerDepuisServeur(restauree)
			return client.invalidateQueries({ queryKey: sceneKeys.versions(scene) })
		},
	})
}
