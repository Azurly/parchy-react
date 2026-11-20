import { useState, type FormEvent } from 'react'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import { formaterDate } from '@/features/projets/libelles'
import type { Utilisateur } from '../api'
import { libelleFormule } from '../formule'
import { useModifierProfil } from '../hooks'

/** Profil : nom affiché modifiable, e-mail et formule en lecture seule. */
function ProfilPage({ user, onMessage }: { user: Utilisateur; onMessage: (message: string) => void }) {
	const modifier = useModifierProfil()
	const [nom, setNom] = useState(user.nomAffichage)
	const erreurNom = modifier.error instanceof ApiError ? modifier.error.fieldErrors.nomAffichage : undefined
	const abonnement = user.abonnement

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const nouveau = nom.trim()
		if (!nouveau || nouveau === user.nomAffichage || modifier.isPending) return
		modifier.mutate({ iri: user['@id'], modification: { nomAffichage: nouveau } }, { onSuccess: () => onMessage('Votre nom affiché a été mis à jour.') })
	}

	return (
		<div className="workspace-panel profile-panel">
			<div className="workspace-panel-heading"><div><span className="book-kicker">COMPTE AUTEUR</span><h2>Informations personnelles</h2></div></div>
			<div className="profile-summary">
				<span className="profile-avatar-large">{user.nomAffichage.slice(0, 2).toUpperCase()}</span>
				<span><strong>{user.nomAffichage}</strong><small>{user.email}</small></span>
			</div>

			<form onSubmit={handleSubmit}>
				<label className="profile-field">
					Nom affiché
					<span className="profil-ligne">
						<input value={nom} maxLength={100} required onChange={(e) => setNom(e.target.value)} aria-invalid={Boolean(erreurNom)} />
						<button type="submit" className="primary-button" disabled={modifier.isPending || nom.trim() === user.nomAffichage || !nom.trim()}>
							{modifier.isPending ? 'Enregistrement…' : 'Enregistrer'}
						</button>
					</span>
					{erreurNom && <span className="projet-field-error">{erreurNom}</span>}
					{modifier.isError && !erreurNom && <span className="projet-field-error">{getErrorMessage(modifier.error)}</span>}
				</label>
			</form>

			<label className="profile-field">
				Adresse e-mail
				<input type="email" value={user.email} readOnly />
				<small className="profil-aide">{user.emailVerifieLe ? `Adresse vérifiée le ${formaterDate(user.emailVerifieLe)}` : 'Adresse pas encore vérifiée'}</small>
			</label>
			<label className="profile-field">
				Formule actuelle
				<input value={libelleFormule(user)} readOnly />
				{abonnement?.periodeFin && <small className="profil-aide">{abonnement.statut === 'annule' ? 'Se termine' : 'Renouvellement'} le {formaterDate(abonnement.periodeFin)}</small>}
			</label>
			<p className="profil-aide">Membre depuis le {formaterDate(user.creeLe)}</p>
		</div>
	)
}

export default ProfilPage
