import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronRight, PenLine, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AjoutRapide from '@/components/ajout-rapide'
import { getErrorMessage } from '@/shared/api/errors'
import { useProjetActif } from '@/features/projets/hooks'
import { useCreerScene, useModifierScene, useScenes, useSupprimerScene } from '@/features/scenes/hooks'
import { formaterMots, libelleStatutScene, scenesParChapitre } from '@/features/scenes/libelles'
import { ouvrirScene } from '@/features/scenes/scene-active'
import type { Scene } from '@/features/scenes/api'
import type { Chapitre } from '../api'
import { useChapitres, useCreerChapitre, useModifierChapitre, useSupprimerChapitre } from '../hooks'
import './plan.css'

type ASupprimer = { type: 'chapitre'; chapitre: Chapitre } | { type: 'scene'; scene: Scene } | null

/** Plan du roman : chapitres et scènes, ordre, titres, suppression. */
function PlanPage({ onOuvrirManuscrit, onCreerProjet }: { onOuvrirManuscrit: () => void; onCreerProjet: () => void }) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const chapitres = useChapitres(projetIri)
	const scenes = useScenes(projetIri)
	const [aSupprimer, setASupprimer] = useState<ASupprimer>(null)

	if (!projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour construire son plan.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	const groupes = scenesParChapitre(scenes.data)
	const totalMots = chapitres.data?.reduce((total, c) => total + (c.nombreMots ?? 0), 0) ?? 0
	const erreur = chapitres.error ?? scenes.error

	return (
		<div className="workspace-panel outline-panel">
			<div className="workspace-panel-heading">
				<div><span className="book-kicker">PLAN DU ROMAN</span><h2>{projet.titre}</h2></div>
				{chapitres.isSuccess && <span className="plan-progress-label">{chapitres.data.length} chapitre{chapitres.data.length > 1 ? 's' : ''} · {formaterMots(totalMots)}</span>}
			</div>

			{(chapitres.isPending || scenes.isPending) && [0, 1].map((i) => <Skeleton key={i} className="mb-4 h-24 w-full rounded-md" />)}
			{erreur && <p className="manuscrit-erreur" role="alert">{getErrorMessage(erreur)}</p>}

			{chapitres.data?.map((chapitre, index) => (
				<ChapitrePlan
					key={chapitre['@id']}
					projetIri={projetIri}
					chapitre={chapitre}
					numero={index + 1}
					dernier={index === chapitres.data.length - 1}
					scenes={groupes.get(chapitre['@id']) ?? []}
					onOuvrirScene={(scene) => { ouvrirScene(scene['@id']); onOuvrirManuscrit() }}
					onSupprimer={setASupprimer}
				/>
			))}

			{chapitres.isSuccess && chapitres.data.length === 0 && <p className="empty-state">Votre plan est vide. Ajoutez un premier chapitre.</p>}
			{chapitres.isSuccess && <AjoutChapitre projetIri={projetIri} />}

			{aSupprimer && <ConfirmerSuppression projetIri={projetIri} cible={aSupprimer} onClose={() => setASupprimer(null)} />}
		</div>
	)
}

function AjoutChapitre({ projetIri }: { projetIri: string }) {
	const creer = useCreerChapitre(projetIri)
	return (
		<AjoutRapide
			className="plan-ajout-chapitre"
			libelle="Ajouter un chapitre"
			placeholder="Titre du chapitre"
			enCours={creer.isPending}
			erreur={creer.error ? getErrorMessage(creer.error) : undefined}
			onAjouter={(titre) => creer.mutateAsync({ titre: titre || 'Nouveau chapitre' })}
		/>
	)
}

interface ChapitrePlanProps {
	projetIri: string
	chapitre: Chapitre
	numero: number
	dernier: boolean
	scenes: Scene[]
	onOuvrirScene: (scene: Scene) => void
	onSupprimer: (cible: ASupprimer) => void
}

function ChapitrePlan({ projetIri, chapitre, numero, dernier, scenes, onOuvrirScene, onSupprimer }: ChapitrePlanProps) {
	const modifierChapitre = useModifierChapitre(projetIri)
	const modifierScene = useModifierScene(projetIri)
	const creerScene = useCreerScene(projetIri)
	const [titre, setTitre] = useState(chapitre.titre)
	const position = chapitre.position ?? numero
	const erreur = modifierChapitre.error ?? modifierScene.error

	function enregistrerTitre() {
		const nouveau = titre.trim()
		if (!nouveau || nouveau === chapitre.titre) {
			setTitre(chapitre.titre)
			return
		}
		modifierChapitre.mutate({ iri: chapitre['@id'], modification: { titre: nouveau } }, { onError: () => setTitre(chapitre.titre) })
	}

	function deplacerChapitre(nouvellePosition: number) {
		modifierChapitre.mutate({ iri: chapitre['@id'], modification: { position: nouvellePosition } })
	}

	function deplacerScene(scene: Scene, nouvellePosition: number) {
		modifierScene.mutate({ iri: scene['@id'], modification: { position: nouvellePosition } })
	}

	const occupe = modifierChapitre.isPending || modifierScene.isPending

	return (
		<section className="act-section plan-chapitre">
			<div className="plan-chapitre-entete">
				<span className="plan-row-number">{String(numero).padStart(2, '0')}</span>
				<input className="plan-chapitre-titre" value={titre} maxLength={255} aria-label={`Titre du chapitre ${numero}`} onChange={(e) => setTitre(e.target.value)} onBlur={enregistrerTitre} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
				<small>{formaterMots(chapitre.nombreMots)}</small>
				<span className="plan-actions">
					<button type="button" className="icon-button" aria-label="Monter le chapitre" disabled={occupe || position <= 1} onClick={() => deplacerChapitre(position - 1)}><ArrowUp size={14} /></button>
					<button type="button" className="icon-button" aria-label="Descendre le chapitre" disabled={occupe || dernier} onClick={() => deplacerChapitre(position + 1)}><ArrowDown size={14} /></button>
					<button type="button" className="icon-button" aria-label="Supprimer le chapitre" onClick={() => onSupprimer({ type: 'chapitre', chapitre })}><Trash2 size={14} /></button>
				</span>
			</div>
			{erreur && <p className="manuscrit-erreur" role="alert">{getErrorMessage(erreur)}</p>}

			{scenes.map((scene, index) => (
				<div className="outline-plan-row plan-scene" key={scene['@id']}>
					<button type="button" className="plan-scene-ouvrir" onClick={() => onOuvrirScene(scene)}>
						<PenLine size={13} />
						<span className="plan-scene-titre">{scene.titre || 'Scène sans titre'}</span>
						<span className={`plan-statut statut-${scene.statut ?? 'plan'}`}>{libelleStatutScene(scene.statut)}</span>
						<small>{formaterMots(scene.nombreMots)}</small>
						<ChevronRight size={14} />
					</button>
					<span className="plan-actions">
						<button type="button" className="icon-button" aria-label="Monter la scène" disabled={occupe || index === 0} onClick={() => deplacerScene(scene, (scene.position ?? index + 1) - 1)}><ArrowUp size={13} /></button>
						<button type="button" className="icon-button" aria-label="Descendre la scène" disabled={occupe || index === scenes.length - 1} onClick={() => deplacerScene(scene, (scene.position ?? index + 1) + 1)}><ArrowDown size={13} /></button>
						<button type="button" className="icon-button" aria-label="Supprimer la scène" onClick={() => onSupprimer({ type: 'scene', scene })}><Trash2 size={13} /></button>
					</span>
				</div>
			))}

			<AjoutRapide
				className="ajout-scene"
				libelle="Ajouter une scène"
				placeholder="Titre de la scène"
				enCours={creerScene.isPending}
				erreur={creerScene.error ? getErrorMessage(creerScene.error) : undefined}
				onAjouter={(titreScene) => creerScene.mutateAsync({ chapitre: chapitre['@id'], titre: titreScene })}
			/>
		</section>
	)
}

function ConfirmerSuppression({ projetIri, cible, onClose }: { projetIri: string; cible: NonNullable<ASupprimer>; onClose: () => void }) {
	const supprimerChapitre = useSupprimerChapitre(projetIri)
	const supprimerScene = useSupprimerScene(projetIri)
	const mutation = cible.type === 'chapitre' ? supprimerChapitre : supprimerScene
	const titre = cible.type === 'chapitre' ? cible.chapitre.titre : cible.scene.titre || 'Scène sans titre'

	function confirmer() {
		const options = { onSuccess: onClose }
		if (cible.type === 'chapitre') supprimerChapitre.mutate(cible.chapitre['@id'], options)
		else supprimerScene.mutate(cible.scene['@id'], options)
	}

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog">
				<DialogHeader>
					<DialogTitle>Supprimer « {titre} » ?</DialogTitle>
					<DialogDescription>
						{cible.type === 'chapitre'
							? 'Le chapitre et toutes ses scènes seront supprimés définitivement, ainsi que leur historique.'
							: 'La scène, son texte et son historique seront supprimés définitivement.'}
					</DialogDescription>
				</DialogHeader>
				{mutation.isError && <p className="projet-form-error" role="alert">{getErrorMessage(mutation.error)}</p>}
				<div className="projet-form-actions">
					<button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
					<button type="button" className="primary-button danger-button" disabled={mutation.isPending} onClick={confirmer}>
						<Trash2 size={14} /> {mutation.isPending ? 'Suppression…' : 'Supprimer'}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default PlanPage
