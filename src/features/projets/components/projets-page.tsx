import { useState } from 'react'
import { ArrowRight, MoreHorizontal, PenLine, Plus, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getErrorMessage } from '@/shared/api/errors'
import type { Projet } from '../api'
import { useProjetActif, useProjets, useSupprimerProjet } from '../hooks'
import { depuis, initiales, libelleStatut } from '../libelles'
import ProjetForm from './projet-form'
import './projets.css'

interface ProjetsPageProps {
	/** Appelé quand l'auteur ouvre un projet (il devient le projet actif). */
	onOuvrir: () => void
	onMessage: (message: string) => void
}

type Edition = { mode: 'creation' } | { mode: 'modification'; projet: Projet } | null

function ProjetsPage({ onOuvrir, onMessage }: ProjetsPageProps) {
	const projets = useProjets()
	const { projet: actif, choisir } = useProjetActif()
	const supprimer = useSupprimerProjet()
	const [edition, setEdition] = useState<Edition>(null)
	const [aSupprimer, setASupprimer] = useState<Projet | null>(null)

	const liste = projets.data ?? []

	return (
		<div className="workspace-panel project-list-panel">
			<div className="workspace-panel-heading">
				<div>
					<span className="book-kicker">VOTRE BIBLIOTHÈQUE</span>
					<h2>{projets.isPending ? 'Chargement…' : `${liste.length} projet${liste.length > 1 ? 's' : ''}`}</h2>
				</div>
				<button className="primary-button" type="button" onClick={() => setEdition({ mode: 'creation' })}><Plus size={15} /> Nouveau projet</button>
			</div>

			{projets.isPending && <div className="project-list">{[0, 1].map((i) => <Skeleton key={i} className="my-3 h-14 w-full rounded-md" />)}</div>}

			{projets.isError && (
				<div className="projet-load-error" role="alert">
					<span>{getErrorMessage(projets.error)}</span>
					<button className="text-action" type="button" onClick={() => void projets.refetch()}>Réessayer</button>
				</div>
			)}

			{projets.isSuccess && liste.length === 0 && <p className="empty-state">Votre bibliothèque est vide. Créez votre premier projet.</p>}

			{liste.length > 0 && (
				<div className="project-list">
					{liste.map((projet, index) => (
						<div className={`project-list-row ${actif?.['@id'] === projet['@id'] ? 'is-active' : ''}`} key={projet['@id']}>
							<button className="project-list-open" type="button" onClick={() => { choisir(projet['@id']); onOuvrir() }}>
								<span className={`project-list-cover cover-tone-${index % 2}`}>{initiales(projet.titre)}</span>
								<span className="project-list-copy">
									<strong>{projet.titre}</strong>
									<small>{[projet.genre, projet.pitch].filter(Boolean).join(' · ') || 'Pas encore de pitch'}</small>
								</span>
								<span className="project-list-date"><span className="status-dot" />{libelleStatut(projet.statut)} · {depuis(projet.misAJourLe)}</span>
								<ArrowRight size={16} />
							</button>
							<DropdownMenu>
								<DropdownMenuTrigger className="icon-button" aria-label={`Actions pour ${projet.titre}`}><MoreHorizontal size={17} /></DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-52">
									<DropdownMenuItem onClick={() => setEdition({ mode: 'modification', projet })}><PenLine /> Modifier</DropdownMenuItem>
									<DropdownMenuItem variant="destructive" onClick={() => { supprimer.reset(); setASupprimer(projet) }}><Trash2 /> Mettre à la corbeille</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}
				</div>
			)}

			{edition && (
				<ProjetForm
					projet={edition.mode === 'modification' ? edition.projet : undefined}
					onClose={() => setEdition(null)}
					onSaved={() => {
						onMessage(edition.mode === 'creation' ? 'Projet ajouté à votre bibliothèque.' : 'Projet mis à jour.')
						setEdition(null)
					}}
				/>
			)}

			{aSupprimer && (
				<Dialog open onOpenChange={(open) => { if (!open) setASupprimer(null) }}>
					<DialogContent className="projet-dialog">
						<DialogHeader>
							<DialogTitle>Mettre « {aSupprimer.titre} » à la corbeille ?</DialogTitle>
							<DialogDescription>Le projet et tout son contenu seront supprimés définitivement au bout de 30 jours.</DialogDescription>
						</DialogHeader>
						{supprimer.isError && <p className="projet-form-error" role="alert">{getErrorMessage(supprimer.error)}</p>}
						<div className="projet-form-actions">
							<button type="button" className="secondary-button" onClick={() => setASupprimer(null)}>Annuler</button>
							<button
								type="button"
								className="primary-button danger-button"
								disabled={supprimer.isPending}
								onClick={() => supprimer.mutate(aSupprimer['@id'], {
									onSuccess: () => {
										onMessage(`« ${aSupprimer.titre} » a été mis à la corbeille.`)
										setASupprimer(null)
									},
								})}
							>
								<Trash2 size={14} /> {supprimer.isPending ? 'Suppression…' : 'Mettre à la corbeille'}
							</button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	)
}

export default ProjetsPage
