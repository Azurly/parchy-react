import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getErrorMessage } from '@/shared/api/errors'
import { useEntites } from '@/features/univers/hooks'
import { libelleType } from '@/features/univers/libelles'
import type { SceneDetail } from '../api'
import { useModifierScene } from '../hooks'

type Role = 'present' | 'mentionne'

/** Fiches présentes ou mentionnées dans la scène (PATCH presences, sans verrou de version). */
function PresencesDialog({ scene, projetIri, onClose }: { scene: SceneDetail; projetIri: string; onClose: () => void }) {
	const entites = useEntites(projetIri)
	const modifier = useModifierScene(projetIri)
	const [roles, setRoles] = useState<Record<string, Role>>(() => Object.fromEntries((scene.presences ?? []).map((p) => [p.entite, p.role ?? 'present'])))
	const fiches = [...(entites.data ?? [])].sort((a, b) => a.type.localeCompare(b.type) || a.nom.localeCompare(b.nom, 'fr'))

	function changer(iri: string, valeur: Role | '') {
		const suivant = { ...roles }
		if (valeur) suivant[iri] = valeur
		else delete suivant[iri]
		setRoles(suivant)
	}

	function enregistrer() {
		const presences = Object.entries(roles).map(([entite, role]) => ({ entite, role }))
		modifier.mutate({ iri: scene['@id'], modification: { presences } }, { onSuccess: onClose })
	}

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog fiche-dialog">
				<DialogHeader>
					<DialogTitle>Qui est dans cette scène ?</DialogTitle>
					<DialogDescription>Indiquez les fiches présentes ou simplement mentionnées dans « {scene.titre || 'Scène sans titre'} ».</DialogDescription>
				</DialogHeader>
				{entites.isSuccess && fiches.length === 0 && <p className="empty-state">Aucune fiche dans l’univers de ce projet pour l’instant.</p>}
				<ul className="presences-liste">
					{fiches.map((fiche) => (
						<li key={fiche['@id']}>
							<span><strong>{fiche.nom}</strong><small>{libelleType(fiche.type)}</small></span>
							<select aria-label={`Présence de ${fiche.nom}`} value={roles[fiche['@id']] ?? ''} onChange={(e) => changer(fiche['@id'], e.target.value as Role | '')}>
								<option value="">Absent</option>
								<option value="present">Présent</option>
								<option value="mentionne">Mentionné</option>
							</select>
						</li>
					))}
				</ul>
				{modifier.isError && <p className="projet-form-error" role="alert">{getErrorMessage(modifier.error)}</p>}
				<div className="projet-form-actions">
					<button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
					<button type="button" className="primary-button" disabled={modifier.isPending || !entites.isSuccess} onClick={enregistrer}>
						{modifier.isPending && <LoaderCircle size={14} className="projet-spinner" />} Enregistrer
					</button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default PresencesDialog
