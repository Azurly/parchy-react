import { useState } from 'react'
import { AlertTriangle, Check, CloudOff, History, LoaderCircle, PenLine, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import AjoutRapide from '@/components/ajout-rapide'
import { getErrorMessage } from '@/shared/api/errors'
import * as sync from '@/sync'
import { useProjetActif } from '@/features/projets/hooks'
import { useChapitres, useCreerChapitre } from '@/features/chapitres/hooks'
import type { SceneDetail, StatutScene } from '../api'
import { useCreerScene, useEtatSync, useModifierScene, useScene, useScenes } from '../hooks'
import { formaterMots, scenesParChapitre, statutsScene } from '../libelles'
import { ouvrirScene, useSceneActive } from '../scene-active'
import ConflitDialog from './conflit-dialog'
import SceneEditor from './scene-editor'
import PresencesDialog from './presences-dialog'
import VersionsDialog from './versions-dialog'
import './scenes.css'

function ManuscritPage({ onCreerProjet }: { onCreerProjet: () => void }) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const chapitres = useChapitres(projetIri)
	const scenes = useScenes(projetIri)
	const active = useSceneActive()
	const groupes = scenesParChapitre(scenes.data)
	const sceneIri = scenes.data?.some((s) => s['@id'] === active) ? active : scenes.data?.[0]?.['@id']

	if (!projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour commencer à écrire.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	const chargement = chapitres.isPending || scenes.isPending
	const erreur = chapitres.error ?? scenes.error

	return (
		<div className="workspace-panel writing-workspace">
			<aside className="writing-outline">
				<div className="workspace-panel-heading"><div><span className="book-kicker">{projet.titre.toUpperCase()}</span><h2>Chapitres</h2></div></div>
				{chargement && [0, 1, 2].map((i) => <Skeleton key={i} className="mb-2 h-10 w-full rounded-md" />)}
				{erreur && <p className="manuscrit-erreur" role="alert">{getErrorMessage(erreur)}</p>}
				{chapitres.data?.map((chapitre, index) => (
					<section className="outline-groupe" key={chapitre['@id']}>
						<p className="outline-chapitre-titre"><span>{String(index + 1).padStart(2, '0')}</span>{chapitre.titre}<small>{formaterMots(chapitre.nombreMots)}</small></p>
						{groupes.get(chapitre['@id'])?.map((scene) => (
							<button className={`outline-chapter ${scene['@id'] === sceneIri ? 'selected' : ''}`} type="button" key={scene['@id']} onClick={() => ouvrirScene(scene['@id'])}>
								<span>{scene.position}</span>{scene.titre || 'Scène sans titre'}<small>{formaterMots(scene.nombreMots)}</small>
							</button>
						))}
						<AjoutScene projetIri={projetIri} chapitreIri={chapitre['@id']} />
					</section>
				))}
				{chapitres.isSuccess && <AjoutChapitre projetIri={projetIri} />}
			</aside>

			<div className="writing-editor">
				{sceneIri ? <SceneOuverte key={sceneIri} iri={sceneIri} projetIri={projetIri} /> : !chargement && (
					<p className="manuscrit-astuce">
						{chapitres.data?.length ? 'Ajoutez une scène à un chapitre pour commencer à écrire.' : 'Commencez par créer un premier chapitre dans la colonne de gauche.'}
					</p>
				)}
			</div>
		</div>
	)
}

function AjoutChapitre({ projetIri }: { projetIri: string }) {
	const creer = useCreerChapitre(projetIri)
	return (
		<AjoutRapide
			libelle="Ajouter un chapitre"
			placeholder="Titre du chapitre"
			enCours={creer.isPending}
			erreur={creer.error ? getErrorMessage(creer.error) : undefined}
			onAjouter={(titre) => creer.mutateAsync({ titre: titre || 'Nouveau chapitre' })}
		/>
	)
}

function AjoutScene({ projetIri, chapitreIri }: { projetIri: string; chapitreIri: string }) {
	const creer = useCreerScene(projetIri)
	return (
		<AjoutRapide
			className="ajout-scene"
			libelle="Scène"
			placeholder="Titre de la scène"
			enCours={creer.isPending}
			erreur={creer.error ? getErrorMessage(creer.error) : undefined}
			onAjouter={async (titre) => {
				const scene = await creer.mutateAsync({ chapitre: chapitreIri, titre })
				ouvrirScene(scene['@id'])
			}}
		/>
	)
}

function SceneOuverte({ iri, projetIri }: { iri: string; projetIri: string }) {
	const scene = useScene(iri)
	const etat = useEtatSync(iri)
	const [mots, setMots] = useState<number | null>(null)
	const [historique, setHistorique] = useState(false)
	const [presences, setPresences] = useState(false)

	if (scene.isPending) return <div className="scene-editor-loading"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
	if (scene.isError) return <p className="manuscrit-erreur" role="alert">{getErrorMessage(scene.error)}</p>

	return (
		<>
			<div className="editor-toolbar">
				<EnTeteScene scene={scene.data} projetIri={projetIri} />
				<span className="editor-toolbar-droite">
					<span className="editor-mots">{formaterMots(mots ?? scene.data.nombreMots)}</span>
					<IndicateurSync iri={iri} etat={etat} />
					<button type="button" className="text-action scene-presences" title="Fiches présentes dans la scène" onClick={() => setPresences(true)}><Users size={13} /> {scene.data.presences?.length ?? 0}</button>
					<button type="button" className="icon-button" aria-label="Historique des versions" title="Historique des versions" onClick={() => setHistorique(true)}><History size={15} /></button>
				</span>
			</div>
			<SceneEditor scene={scene.data} onMots={setMots} />
			<ConflitDialog iri={iri} etat={etat} />
			{historique && <VersionsDialog sceneIri={iri} onClose={() => setHistorique(false)} />}
			{presences && <PresencesDialog scene={scene.data} projetIri={projetIri} onClose={() => setPresences(false)} />}
		</>
	)
}

/** Titre et statut de la scène : enregistrés par PATCH, sans verrou de version. */
function EnTeteScene({ scene, projetIri }: { scene: SceneDetail; projetIri: string }) {
	const modifier = useModifierScene(projetIri)
	const [titre, setTitre] = useState(scene.titre ?? '')

	function enregistrerTitre() {
		const nouveau = titre.trim()
		if (nouveau === (scene.titre ?? '')) return
		modifier.mutate({ iri: scene['@id'], modification: { titre: nouveau } }, { onError: () => setTitre(scene.titre ?? '') })
	}

	return (
		<span className="scene-entete">
			<PenLine size={14} />
			<input className="scene-titre" value={titre} maxLength={255} placeholder="Scène sans titre" aria-label="Titre de la scène" onChange={(e) => setTitre(e.target.value)} onBlur={enregistrerTitre} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
			<select className="scene-statut" aria-label="Statut de la scène" value={scene.statut ?? 'plan'} onChange={(e) => modifier.mutate({ iri: scene['@id'], modification: { statut: e.target.value as StatutScene } })}>
				{statutsScene.map((s) => <option key={s.valeur} value={s.valeur}>{s.libelle}</option>)}
			</select>
			{modifier.isError && <span className="scene-entete-erreur" role="alert">{getErrorMessage(modifier.error)}</span>}
		</span>
	)
}

function IndicateurSync({ iri, etat }: { iri: string; etat: sync.EtatSync }) {
	switch (etat.statut) {
		case 'synchronise':
			return <span className="saved-state"><i />Enregistré</span>
		case 'en_attente':
			return <span className="unsaved-state"><i />Modifications en attente</span>
		case 'envoi':
			return <span className="unsaved-state"><LoaderCircle size={11} className="projet-spinner" />Enregistrement…</span>
		case 'hors_ligne':
			return <span className="unsaved-state" title="Votre texte est conservé sur cet appareil et sera envoyé au retour de la connexion."><CloudOff size={12} />Hors ligne · gardé sur cet appareil</span>
		case 'conflit':
			return <span className="sync-erreur"><AlertTriangle size={12} />Conflit à résoudre</span>
		case 'erreur':
			return (
				<span className="sync-erreur" title={etat.message}>
					<AlertTriangle size={12} />Non enregistré
					<button type="button" className="text-action" onClick={() => void sync.envoyer(iri)}>Réessayer</button>
				</span>
			)
		default:
			return <span className="saved-state"><Check size={12} /></span>
	}
}

export default ManuscritPage
