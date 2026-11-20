import { ArrowDownRight, ArrowRight, BookOpen, Sparkles, X } from 'lucide-react'
import { useProjetActif } from '@/features/projets/hooks'
import { depuis } from '@/features/projets/libelles'
import { useChapitres } from '@/features/chapitres/hooks'
import { useScenes } from '../hooks'
import { formaterMots } from '../libelles'
import { ouvrirScene } from '../scene-active'

interface RepriseModalProps {
	onClose: () => void
	onOuvrir: (page: 'Manuscrit' | 'Plan du roman' | 'Mes projets') => void
}

/** « On reprend le fil ? » : propose la dernière scène modifiée du projet actif. */
function RepriseModal({ onClose, onOuvrir }: RepriseModalProps) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const scenes = useScenes(projetIri)
	const chapitres = useChapitres(projetIri)
	const derniere = [...(scenes.data ?? [])].sort((a, b) => (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? ''))[0]
	const indexChapitre = chapitres.data?.findIndex((c) => c['@id'] === derniere?.chapitre) ?? -1
	const chapitre = indexChapitre >= 0 ? chapitres.data?.[indexChapitre] : undefined

	let description = 'Choisissez d’abord un projet pour vous remettre à l’écriture.'
	if (projet && derniere) description = `Votre dernière modification date ${depuis(derniere.misAJourLe)}. Installez-vous, votre histoire vous attend.`
	else if (projet && scenes.isSuccess) description = 'Ce projet n’a pas encore de scène : commencez par poser un premier chapitre dans le plan.'

	function commencer() {
		onClose()
		if (!projet) return onOuvrir('Mes projets')
		if (!derniere) return onOuvrir('Plan du roman')
		ouvrirScene(derniere['@id'])
		onOuvrir('Manuscrit')
	}

	return (
		<div className="modal-backdrop" role="presentation" onClick={onClose}>
			<section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-modal-title" onClick={(event) => event.stopPropagation()}>
				<button className="icon-button modal-close" type="button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
				<span className="modal-sparkle"><Sparkles size={19} /></span>
				<p className="eyebrow">UNE PETITE SESSION, UN GRAND PAS</p>
				<h2 id="quick-modal-title">On reprend le fil ?</h2>
				<p className="modal-description">{scenes.isPending && projet ? 'Recherche de votre dernière page…' : description}</p>
				{projet && derniere && (
					<div className="modal-session-info">
						<BookOpen size={17} />
						<span>
							<strong>{derniere.titre || 'Scène sans titre'}</strong>
							<small>{[chapitre ? `Chapitre ${indexChapitre + 1} · ${chapitre.titre}` : projet.titre, formaterMots(derniere.nombreMots)].join(' · ')}</small>
						</span>
						<ArrowDownRight size={16} />
					</div>
				)}
				<button className="primary-button modal-start" type="button" onClick={commencer}>
					{!projet ? 'Voir mes projets' : derniere ? 'Reprendre cette scène' : 'Ouvrir le plan'} <ArrowRight size={15} />
				</button>
				<button className="modal-later" type="button" onClick={onClose}>Je reviendrai plus tard</button>
			</section>
		</div>
	)
}

export default RepriseModal
