import { useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import { formaterDate } from '@/features/projets/libelles'
import type { SceneVersion } from '../api'
import { useCreerInstantane, useRestaurerVersion, useVersions } from '../hooks'

const origines: Record<string, string> = {
	auto: 'Sauvegarde automatique',
	manuelle: 'Instantané',
	conflit: 'Avant résolution d’un conflit',
	restauration: 'Avant restauration',
}

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function quand(version: SceneVersion): string {
	if (!version.creeLe) return ''
	return `${formaterDate(version.creeLe)} à ${heure.format(new Date(version.creeLe))}`
}

/** Historique des versions d'une scène : instantané manuel et restauration. */
function VersionsDialog({ sceneIri, onClose }: { sceneIri: string; onClose: () => void }) {
	const versions = useVersions(sceneIri, true)
	const instantane = useCreerInstantane(sceneIri)
	const restaurer = useRestaurerVersion(sceneIri)
	const [aRestaurer, setARestaurer] = useState<SceneVersion | null>(null)
	const erreur = instantane.error ?? restaurer.error
	const liste = [...(versions.data ?? [])].sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0))

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog versions-dialog">
				<DialogHeader>
					<DialogTitle>Historique de la scène</DialogTitle>
					<DialogDescription>Parchy archive votre texte au fil de l’écriture. Restaurer une version archive d’abord le texte actuel.</DialogDescription>
				</DialogHeader>

				<button type="button" className="secondary-button versions-instantane" disabled={instantane.isPending} onClick={() => instantane.mutate()}>
					<History size={14} /> {instantane.isPending ? 'Création…' : 'Créer un instantané maintenant'}
				</button>

				{erreur && <p className="projet-form-error" role="alert">{getErrorMessage(erreur)}</p>}
				{instantane.isSuccess && !erreur && <p className="versions-ok" role="status">Instantané créé.</p>}

				<div className="versions-liste">
					{versions.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)}
					{versions.isError && <p className="projet-form-error">{getErrorMessage(versions.error)}</p>}
					{versions.isSuccess && liste.length === 0 && <p className="empty-state">Aucune version archivée pour l’instant.</p>}
					{liste.map((version) => (
						<div className="versions-ligne" key={version['@id']}>
							<span>
								<strong>Version {version.numero} · {origines[version.origine ?? ''] ?? version.origine}</strong>
								<small>{quand(version)} · {version.nombreMots ?? 0} mots</small>
							</span>
							{aRestaurer?.['@id'] === version['@id'] ? (
								<span className="versions-confirmer">
									<button type="button" className="text-action" onClick={() => setARestaurer(null)}>Annuler</button>
									<button
										type="button"
										className="primary-button"
										disabled={restaurer.isPending}
										onClick={() => restaurer.mutate(version['@id'], { onSuccess: () => { setARestaurer(null); onClose() } })}
									>
										{restaurer.isPending ? 'Restauration…' : 'Confirmer'}
									</button>
								</span>
							) : (
								<button type="button" className="text-action" onClick={() => { restaurer.reset(); setARestaurer(version) }}><RotateCcw size={13} /> Restaurer</button>
							)}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default VersionsDialog
