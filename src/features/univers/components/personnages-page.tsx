import { useState } from 'react'
import { FileText, Plus, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import { useProjetActif } from '@/features/projets/hooks'
import { useScenes } from '@/features/scenes/hooks'
import type { Entite } from '../api'
import { useEntites } from '../hooks'
import { detailsFiche, initialesNom, nombreScenes } from '../libelles'
import FicheDialog from './fiche-dialog'
import './univers.css'

const teintes = ['sage', 'blue', 'rose']

function PersonnagesPage({ onCreerProjet, onMessage }: { onCreerProjet: () => void; onMessage: (message: string) => void }) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const entites = useEntites(projetIri)
	const scenes = useScenes(projetIri)
	const [filtre, setFiltre] = useState('')
	const [edition, setEdition] = useState<Entite | 'nouveau' | null>(null)

	if (!projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour retrouver ses personnages.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	const terme = filtre.trim().toLowerCase()
	const personnages = (entites.data ?? [])
		.filter((e) => e.type === 'personnage')
		.filter((e) => !terme || `${e.nom} ${e.resume ?? ''} ${detailsFiche(e)}`.toLowerCase().includes(terme))
		.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

	return (
		<div className="workspace-panel character-panel">
			<div className="workspace-panel-heading">
				<div><span className="book-kicker">{projet.titre.toUpperCase()}</span><h2>Personnages</h2></div>
				<span className="personnages-actions">
					<label className="inline-search"><Search size={14} /><input aria-label="Filtrer les personnages" placeholder="Filtrer" value={filtre} onChange={(e) => setFiltre(e.target.value)} /></label>
					<button type="button" className="primary-button" onClick={() => setEdition('nouveau')}><Plus size={14} /> Nouveau personnage</button>
				</span>
			</div>

			{entites.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(entites.error)}</p>}

			<div className="character-grid">
				{entites.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-md" />)}
				{personnages.map((personnage, index) => {
					const details = detailsFiche(personnage)
					const apparitions = nombreScenes(personnage, scenes.data)
					return (
						<button type="button" className="character-card personnage-carte" key={personnage['@id']} onClick={() => setEdition(personnage)}>
							<div className={`character-avatar ${teintes[index % teintes.length]}`}>{initialesNom(personnage.nom)}</div>
							<span className="book-kicker">PERSONNAGE</span>
							<h3>{personnage.nom}</h3>
							{personnage.resume && <p>{personnage.resume}</p>}
							{details && <p className="personnage-details">{details}</p>}
							<div className="character-card-footer">
								<span><FileText size={13} /> {apparitions === 0 ? 'Dans aucune scène' : `Dans ${apparitions} scène${apparitions > 1 ? 's' : ''}`}</span>
							</div>
						</button>
					)
				})}
				{entites.isSuccess && personnages.length === 0 && (
					<p className="empty-state">{terme ? 'Aucun personnage ne correspond à cette recherche.' : 'Aucun personnage dans ce projet pour l’instant.'}</p>
				)}
			</div>

			{edition && (
				<FicheDialog
					projetIri={projetIri}
					entite={edition === 'nouveau' ? undefined : edition}
					typeInitial="personnage"
					onClose={() => setEdition(null)}
					onMessage={onMessage}
				/>
			)}
		</div>
	)
}

export default PersonnagesPage
