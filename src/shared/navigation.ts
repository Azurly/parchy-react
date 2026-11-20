import { useCallback, useEffect, useState } from 'react'

/**
 * Navigation entre les pages de l'application, reliée à l'historique du navigateur :
 * chaque changement de page ajoute une entrée, donc « Précédent » et « Suivant »
 * reviennent à la page d'avant au lieu de quitter l'application.
 * La page est aussi écrite dans l'adresse (#/manuscrit) pour survivre à un rechargement.
 */

function versSlug(page: string): string {
	return page
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

function lirePage(pages: readonly string[], parDefaut: string): string {
	const etat = window.history.state as { page?: unknown } | null
	if (typeof etat?.page === 'string' && pages.includes(etat.page)) return etat.page
	const slug = window.location.hash.replace(/^#\/?/, '')
	return pages.find((page) => versSlug(page) === slug) ?? parDefaut
}

export function useNavigation(pages: readonly string[], parDefaut: string) {
	const [page, setPage] = useState(() => lirePage(pages, parDefaut))

	useEffect(() => {
		// Première entrée : on y attache la page courante sans en créer une nouvelle.
		window.history.replaceState({ ...window.history.state, page }, '', `#/${versSlug(page)}`)
		const surRetour = () => setPage(lirePage(pages, parDefaut))
		window.addEventListener('popstate', surRetour)
		return () => window.removeEventListener('popstate', surRetour)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const naviguer = useCallback(
		(cible: string) => {
			if (cible === page) return
			window.history.pushState({ page: cible }, '', `#/${versSlug(cible)}`)
			setPage(cible)
		},
		[page],
	)

	return [page, naviguer] as const
}
