import { Check, ChevronDown, FolderOpen } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProjetActif, useProjets } from '../hooks'
import { initiales, libelleStatut } from '../libelles'

interface ProjectSwitcherProps {
	onVoirTous: () => void
}

/** Sélecteur du projet actif, en haut de la barre latérale. */
function ProjectSwitcher({ onVoirTous }: ProjectSwitcherProps) {
	const { data: projets = [], isPending } = useProjets()
	const { projet: actif, choisir } = useProjetActif()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="project-switcher">
				<span className="project-cover">{actif ? initiales(actif.titre) : '··'}</span>
				<span className="project-switcher-copy">
					<strong>{isPending ? 'Chargement…' : actif?.titre ?? 'Aucun projet'}</strong>
					<small>{actif ? libelleStatut(actif.statut) : 'Créez votre premier roman'}</small>
				</span>
				<ChevronDown size={15} />
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64">
				{projets.map((projet) => (
					<DropdownMenuItem key={projet['@id']} onClick={() => choisir(projet['@id'])}>
						<span className="min-w-0 flex-1 truncate">{projet.titre}</span>
						{actif?.['@id'] === projet['@id'] && <Check />}
					</DropdownMenuItem>
				))}
				{projets.length > 0 && <DropdownMenuSeparator />}
				<DropdownMenuItem onClick={onVoirTous}><FolderOpen /> Tous mes projets</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default ProjectSwitcher
