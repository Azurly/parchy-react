import { useState } from 'react'
import { ArrowRight, CalendarDays, ChevronRight, Lightbulb, MapPin, Package, Plus, Shield, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import { useProjetActif } from '@/features/projets/hooks'
import { depuis } from '@/features/projets/libelles'
import type { Entite, TypeEntite } from '../api'
import { useEntites, useEvenements, useRelations } from '../hooks'
import { detailsFiche, libelleType, typesEntite } from '../libelles'
import Chronologie from './chronologie'
import FicheDialog from './fiche-dialog'
import './univers.css'

const icones: Record<TypeEntite, typeof Users> = {
	personnage: Users,
	lieu: MapPin,
	objet: Package,
	organisation: Shield,
	concept: Lightbulb,
}

type Filtre = TypeEntite | 'tous' | 'chronologie'
type Edition = { entite: Entite } | { type: TypeEntite } | null

interface UniversPageProps {
	onVoirPersonnages: () => void
	onCreerProjet: () => void
	onMessage: (message: string) => void
}

function UniversPage({ onVoirPersonnages, onCreerProjet, onMessage }: UniversPageProps) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const entites = useEntites(projetIri)
	const evenements = useEvenements(projetIri)
	const relations = useRelations(projetIri)
	const [filtre, setFiltre] = useState<Filtre>('tous')
	const [edition, setEdition] = useState<Edition>(null)

	if (!projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour construire son univers.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	const compter = (type: TypeEntite) => entites.data?.filter((e) => e.type === type).length ?? 0
	const nombreRelations = (iri: string) => relations.data?.filter((r) => r.source === iri || r.cible === iri).length ?? 0
	const liste = [...(entites.data ?? [])]
		.filter((e) => filtre === 'tous' || e.type === filtre)
		.sort((a, b) => (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? ''))

	return (
		<>
			<div className="universe-stats">
				<div className="workspace-panel universe-stat">
					<span className="section-icon ink-icon"><Users size={16} /></span>
					<strong>{entites.isPending ? '…' : compter('personnage')}</strong><small>Personnages</small>
					<button type="button" onClick={onVoirPersonnages}>Explorer <ArrowRight size={13} /></button>
				</div>
				<div className="workspace-panel universe-stat">
					<span className="section-icon plan-icon"><MapPin size={16} /></span>
					<strong>{entites.isPending ? '…' : compter('lieu')}</strong><small>Lieux</small>
					<button type="button" onClick={() => setFiltre('lieu')}>Explorer <ArrowRight size={13} /></button>
				</div>
				<div className="workspace-panel universe-stat">
					<span className="section-icon goal-icon"><CalendarDays size={16} /></span>
					<strong>{evenements.isPending ? '…' : evenements.data?.length ?? 0}</strong><small>Repères chronologiques</small>
					<button type="button" onClick={() => setFiltre('chronologie')}>Explorer <ArrowRight size={13} /></button>
				</div>
			</div>

			<div className="workspace-panel universe-panel">
				<div className="workspace-panel-heading">
					<div><span className="book-kicker">{projet.titre.toUpperCase()}</span><h2>{filtre === 'chronologie' ? 'Chronologie' : 'Fiches de l’univers'}</h2></div>
					{filtre !== 'chronologie' && (
						<button type="button" className="primary-button" onClick={() => setEdition({ type: filtre === 'tous' ? 'personnage' : filtre })}><Plus size={14} /> Nouvelle fiche</button>
					)}
				</div>

				<div className="univers-filtres" role="tablist" aria-label="Filtrer les fiches">
					{([['tous', 'Tout'], ...typesEntite.map((t) => [t.valeur, t.pluriel]), ['chronologie', 'Chronologie']] as [Filtre, string][]).map(([valeur, libelle]) => (
						<button key={valeur} type="button" role="tab" aria-selected={filtre === valeur} className={filtre === valeur ? 'actif' : ''} onClick={() => setFiltre(valeur)}>{libelle}</button>
					))}
				</div>

				{filtre === 'chronologie' ? <Chronologie projetIri={projetIri} /> : (
					<>
						{entites.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(entites.error)}</p>}
						{entites.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="my-2 h-12 w-full rounded-md" />)}
						<div className="universe-entry-list">
							{entites.isSuccess && liste.length === 0 && <p className="empty-state">Aucune fiche dans cette catégorie pour l’instant.</p>}
							{liste.map((entite) => {
								const Icone = icones[entite.type] ?? Users
								const nbRelations = nombreRelations(entite['@id'])
								return (
									<button type="button" key={entite['@id']} onClick={() => setEdition({ entite })}>
										<span className={`universe-entry-icon ${entite.type === 'personnage' ? 'character-entry' : 'place-entry'}`}><Icone size={17} /></span>
										<span>
											<strong>{entite.nom}</strong>
											<small>{[libelleType(entite.type), entite.resume || detailsFiche(entite), nbRelations ? `${nbRelations} relation${nbRelations > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</small>
										</span>
										<small className="univers-date">{depuis(entite.misAJourLe)}</small>
										<ChevronRight size={15} />
									</button>
								)
							})}
						</div>
					</>
				)}
			</div>

			{edition && (
				<FicheDialog
					projetIri={projetIri}
					entite={'entite' in edition ? edition.entite : undefined}
					typeInitial={'type' in edition ? edition.type : undefined}
					onClose={() => setEdition(null)}
					onMessage={onMessage}
				/>
			)}
		</>
	)
}

export default UniversPage
