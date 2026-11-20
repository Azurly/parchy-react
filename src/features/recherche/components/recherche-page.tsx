import { ArrowUpRight, BookOpen, Compass, FileText, Globe2, Search, Users } from 'lucide-react'
import { useProjetActif, useProjets } from '@/features/projets/hooks'
import { useChapitres } from '@/features/chapitres/hooks'
import { useScenes } from '@/features/scenes/hooks'
import { ouvrirScene } from '@/features/scenes/scene-active'
import { useEntites } from '@/features/univers/hooks'
import { libelleType } from '@/features/univers/libelles'

interface Resultat {
	cle: string
	titre: string
	type: string
	icone: typeof Search
	ouvrir: () => void
}

interface RecherchePageProps {
	requete: string
	onRequete: (valeur: string) => void
	onNavigate: (page: string) => void
}

/** Recherche dans les projets, puis dans les chapitres, scènes et l'univers du projet actif. */
function RecherchePage({ requete, onRequete, onNavigate }: RecherchePageProps) {
	const projets = useProjets()
	const { projet, choisir } = useProjetActif()
	const projetIri = projet?.['@id']
	const chapitres = useChapitres(projetIri)
	const scenes = useScenes(projetIri)
	const entites = useEntites(projetIri)
	const terme = requete.trim().toLowerCase()

	const resultats: Resultat[] = [
		...(projets.data ?? []).map((p) => ({ cle: p['@id'], titre: p.titre, type: 'Projet', icone: BookOpen, ouvrir: () => { choisir(p['@id']); onNavigate('Mes projets') } })),
		...(chapitres.data ?? []).map((c) => ({ cle: c['@id'], titre: c.titre, type: 'Chapitre', icone: Compass, ouvrir: () => onNavigate('Plan du roman') })),
		...(scenes.data ?? []).map((s) => ({ cle: s['@id'], titre: s.titre || 'Scène sans titre', type: 'Scène', icone: FileText, ouvrir: () => { ouvrirScene(s['@id']); onNavigate('Manuscrit') } })),
		...(entites.data ?? []).map((e) => ({ cle: e['@id'], titre: e.nom, type: libelleType(e.type), icone: e.type === 'personnage' ? Users : Globe2, ouvrir: () => onNavigate(e.type === 'personnage' ? 'Personnages' : 'Mon univers') })),
	]
	const trouves = terme ? resultats.filter((r) => `${r.titre} ${r.type}`.toLowerCase().includes(terme)) : []
	const chargement = projets.isPending || chapitres.isPending || scenes.isPending || entites.isPending

	return (
		<div className="workspace-panel search-panel">
			<label className="large-search"><Search size={19} /><input autoFocus placeholder="Un personnage, un lieu, un chapitre…" value={requete} onChange={(e) => onRequete(e.target.value)} /></label>
			<div className="workspace-panel-heading">
				<div>
					<span className="book-kicker">{projet ? `DANS VOS PROJETS ET « ${projet.titre.toUpperCase()} »` : 'DANS VOS PROJETS'}</span>
					<h2>{terme ? `${trouves.length} résultat${trouves.length > 1 ? 's' : ''}` : 'Que cherchez-vous ?'}</h2>
				</div>
			</div>
			<div className="search-results">
				{trouves.map((resultat) => {
					const Icone = resultat.icone
					return (
						<button type="button" key={resultat.cle} onClick={resultat.ouvrir}>
							<span className="search-result-icon"><Icone size={14} /></span>
							<span><strong>{resultat.titre}</strong><small>{resultat.type}</small></span>
							<ArrowUpRight size={15} />
						</button>
					)
				})}
				{terme && !chargement && trouves.length === 0 && <p className="empty-state">Aucun résultat. Essayez un autre terme.</p>}
				{terme && chargement && <p className="empty-state">Recherche en cours…</p>}
				{!terme && <p className="empty-state">Tapez le nom d’un projet, d’un chapitre, d’une scène, d’un personnage ou d’un lieu.</p>}
			</div>
		</div>
	)
}

export default RecherchePage
