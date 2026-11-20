import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Iri } from '@/shared/api/types'
import { creerReponse, lireMethode, listerReponses, modifierReponse, supprimerReponse, type ContenuReponse, type ReponseEtape } from './api'

const conceptionKeys = {
	methode: (iri: Iri) => ['methode', iri] as const,
	reponses: (projet: Iri) => ['reponses', projet] as const,
}

export function useMethode(iri: Iri | null | undefined) {
	return useQuery({
		queryKey: conceptionKeys.methode(iri ?? ''),
		queryFn: ({ signal }) => lireMethode(iri!, signal),
		enabled: Boolean(iri),
		staleTime: Infinity,
	})
}

export function useReponses(projet: Iri | undefined) {
	return useQuery({
		queryKey: conceptionKeys.reponses(projet ?? ''),
		queryFn: ({ signal }) => listerReponses(projet!, signal),
		enabled: Boolean(projet),
	})
}

function remplacerDansListe(liste: ReponseEtape[] | undefined, reponse: ReponseEtape): ReponseEtape[] {
	const sans = (liste ?? []).filter((r) => r['@id'] !== reponse['@id'] && r.etape !== reponse.etape)
	return [...sans, reponse]
}

export function useSupprimerReponse(projet: Iri) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (reponse: ReponseEtape) => supprimerReponse(reponse['@id']),
		onSuccess: (_, reponse) => queryClient.setQueryData<ReponseEtape[]>(conceptionKeys.reponses(projet), (liste) => liste?.filter((r) => r['@id'] !== reponse['@id'])),
	})
}

export type EtatEnregistrement = 'enregistre' | 'en_attente' | 'envoi' | 'erreur'

const delaiEnvoi = 1500

/**
 * Brouillon d'une réponse, enregistré automatiquement 1,5 s après la dernière frappe.
 * Une seule requête à la fois : la première crée la réponse (POST), les suivantes la modifient (PATCH).
 */
export function useReponseAutosauvegardee(projet: Iri, etape: Iri, existante: ReponseEtape | undefined) {
	const queryClient = useQueryClient()
	const [contenu, setContenu] = useState<ContenuReponse>(existante?.contenu ?? {})
	const [etat, setEtat] = useState<EtatEnregistrement>('enregistre')
	const [erreur, setErreur] = useState<unknown>(null)

	const iriRef = useRef<Iri | undefined>(existante?.['@id'])
	const aEnvoyer = useRef<ContenuReponse | null>(null)
	const enCours = useRef(false)
	const minuteur = useRef<number | undefined>(undefined)

	async function envoyer(): Promise<void> {
		window.clearTimeout(minuteur.current)
		minuteur.current = undefined
		if (enCours.current || !aEnvoyer.current) return
		const contenuEnvoye = aEnvoyer.current
		aEnvoyer.current = null
		enCours.current = true
		setEtat('envoi')
		let reussi = false
		try {
			const reponse = iriRef.current
				? await modifierReponse(iriRef.current, contenuEnvoye)
				: await creerReponse(projet, etape, contenuEnvoye)
			iriRef.current = reponse['@id']
			queryClient.setQueryData<ReponseEtape[]>(conceptionKeys.reponses(projet), (liste) => remplacerDansListe(liste, reponse))
			reussi = true
			setErreur(null)
			setEtat(aEnvoyer.current ? 'en_attente' : 'enregistre')
		} catch (e) {
			// On garde le texte pour le prochain essai.
			aEnvoyer.current ??= contenuEnvoye
			setErreur(e)
			setEtat('erreur')
		} finally {
			enCours.current = false
			// Frappes pendant l'envoi : nouvel envoi après la réponse (pas de boucle en cas d'échec).
			if (reussi && aEnvoyer.current && minuteur.current === undefined) minuteur.current = window.setTimeout(() => void envoyer(), delaiEnvoi)
		}
	}

	function modifier(nouveau: ContenuReponse) {
		setContenu(nouveau)
		aEnvoyer.current = nouveau
		setEtat('en_attente')
		window.clearTimeout(minuteur.current)
		minuteur.current = window.setTimeout(() => void envoyer(), delaiEnvoi)
	}

	// En quittant l'étape, on envoie tout de suite ce qui attend.
	useEffect(() => () => {
		if (aEnvoyer.current) void envoyer()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	/** Après suppression de la réponse côté serveur : on repart d'une réponse vierge, sans rien envoyer. */
	function reinitialiser() {
		window.clearTimeout(minuteur.current)
		minuteur.current = undefined
		aEnvoyer.current = null
		iriRef.current = undefined
		setContenu({})
		setErreur(null)
		setEtat('enregistre')
	}

	return { contenu, modifier, reinitialiser, etat, erreur, reessayer: () => void envoyer() }
}
