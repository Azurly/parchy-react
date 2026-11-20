import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as sync from '@/sync'
import { formaterDate } from '@/features/projets/libelles'

/**
 * Conflit de version (409) : la scène a été modifiée ailleurs (autre onglet, autre appareil).
 * Le choix de l'auteur suit la règle du contrat : garder la version du serveur, ou écraser
 * avec la sienne (le texte du serveur est alors archivé dans l'historique).
 */
function ConflitDialog({ iri, etat }: { iri: string; etat: sync.EtatSync }) {
	const [enCours, setEnCours] = useState(false)
	if (etat.statut !== 'conflit' || !etat.serveur) return null
	const serveur = etat.serveur

	async function choisir(choix: 'serveur' | 'local') {
		setEnCours(true)
		try {
			await sync.resoudreConflit(iri, choix)
		} finally {
			setEnCours(false)
		}
	}

	return (
		<Dialog open disablePointerDismissal>
			<DialogContent className="projet-dialog" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Cette scène a été modifiée ailleurs</DialogTitle>
					<DialogDescription>
						Une autre version a été enregistrée{serveur.misAJourLe ? ` le ${formaterDate(serveur.misAJourLe)}` : ''} ({serveur.nombreMots ?? 0} mots),
						probablement depuis un autre onglet ou un autre appareil. Quelle version voulez-vous garder ?
					</DialogDescription>
				</DialogHeader>
				<ul className="conflit-choix">
					<li><strong>Garder celle du serveur</strong> : vos modifications récentes sur cet appareil sont abandonnées.</li>
					<li><strong>Garder ma version</strong> : votre texte remplace celui du serveur, qui reste disponible dans l’historique des versions.</li>
				</ul>
				<div className="projet-form-actions">
					<button type="button" className="secondary-button" disabled={enCours} onClick={() => void choisir('serveur')}>Garder celle du serveur</button>
					<button type="button" className="primary-button" disabled={enCours} onClick={() => void choisir('local')}>Garder ma version</button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default ConflitDialog
