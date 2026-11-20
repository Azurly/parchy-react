import type { Utilisateur } from './api'

/** Même règle que Abonnement::estPremium() côté back : plan payant et statut actif. */
export function estPremium(utilisateur: Utilisateur): boolean {
	const abonnement = utilisateur.abonnement
	return Boolean(abonnement && abonnement.plan !== 'gratuit' && abonnement.statut === 'actif')
}

export function libelleFormule(utilisateur: Utilisateur): string {
	return estPremium(utilisateur) ? 'Premium' : 'Gratuit'
}
