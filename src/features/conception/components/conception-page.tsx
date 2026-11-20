import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, LoaderCircle, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import type { Projet } from '@/features/projets/api'
import { useMethodes, useModifierProjet, useProjetActif } from '@/features/projets/hooks'
import { useCreerEntite, useEntites } from '@/features/univers/hooks'
import type { ContenuReponse, FichePersonnage, Methode, MethodeEtape, ReponseEtape } from '../api'
import { useMethode, useReponseAutosauvegardee, useReponses, useSupprimerReponse, type EtatEnregistrement } from '../hooks'
import './conception.css'

/** Une étape est « faite » dès qu'elle a un texte ou au moins une fiche nommée. */
function estRemplie(reponse: ReponseEtape | undefined): boolean {
	if (!reponse) return false
	const { texte, personnages } = reponse.contenu
	return Boolean(texte?.trim()) || Boolean(personnages?.some((p) => p.nom?.trim()))
}

function ConceptionPage({ onCreerProjet, onEcrire }: { onCreerProjet: () => void; onEcrire: () => void }) {
	const { projet } = useProjetActif()
	const [changerMethode, setChangerMethode] = useState(false)

	if (!projet) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour suivre une méthode d’écriture.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	if (!projet.methode || changerMethode) {
		return <ChoixMethode projet={projet} onChoisi={() => setChangerMethode(false)} onAnnuler={projet.methode ? () => setChangerMethode(false) : undefined} />
	}

	return <ParcoursMethode key={`${projet['@id']}-${projet.methode}`} projet={projet} methodeIri={projet.methode} onChangerMethode={() => setChangerMethode(true)} onEcrire={onEcrire} />
}

// --- Choix de la méthode ---

function ChoixMethode({ projet, onChoisi, onAnnuler }: { projet: Projet; onChoisi: () => void; onAnnuler?: () => void }) {
	const methodes = useMethodes()
	const modifier = useModifierProjet()

	return (
		<div className="workspace-panel">
			<div className="workspace-panel-heading">
				<div><span className="book-kicker">{projet.titre.toUpperCase()}</span><h2>Choisissez une méthode d’écriture</h2></div>
				{onAnnuler && <button type="button" className="text-action" onClick={onAnnuler}><X size={14} /> Annuler</button>}
			</div>
			<p className="conception-intro">Une méthode vous guide étape par étape, de l’idée au plan. Vos réponses sont conservées si vous changez de méthode plus tard.</p>
			{methodes.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="mb-3 h-24 w-full rounded-md" />)}
			{methodes.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(methodes.error)}</p>}
			{modifier.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(modifier.error)}</p>}
			<div className="methode-grille">
				{methodes.data?.map((methode) => (
					<article className={`methode-carte ${methode['@id'] === projet.methode ? 'actuelle' : ''}`} key={methode['@id']}>
						<h3>{methode.nom}</h3>
						{methode.description && <p>{methode.description}</p>}
						<small>{methode.etapes?.length ?? 0} étapes</small>
						<button
							type="button"
							className="primary-button"
							disabled={modifier.isPending || methode['@id'] === projet.methode}
							onClick={() => modifier.mutate({ iri: projet['@id'], modification: { methode: methode['@id'] } }, { onSuccess: onChoisi })}
						>
							{methode['@id'] === projet.methode ? <><Check size={14} /> Méthode actuelle</> : 'Suivre cette méthode'}
						</button>
					</article>
				))}
			</div>
		</div>
	)
}

// --- Parcours des étapes ---

function ParcoursMethode({ projet, methodeIri, onChangerMethode, onEcrire }: { projet: Projet; methodeIri: string; onChangerMethode: () => void; onEcrire: () => void }) {
	const methode = useMethode(methodeIri)
	const reponses = useReponses(projet['@id'])
	const [etapeChoisie, setEtapeChoisie] = useState<string | null>(null)

	if (methode.isPending || reponses.isPending) return <div className="workspace-panel"><Skeleton className="h-64 w-full rounded-md" /></div>
	if (methode.isError || reponses.isError) return <p className="manuscrit-erreur" role="alert">{getErrorMessage(methode.error ?? reponses.error)}</p>

	const etapes = methode.data.etapes ?? []
	const reponseDe = (etape: MethodeEtape) => reponses.data.find((r) => r.etape === etape['@id'])
	const faites = etapes.filter((e) => estRemplie(reponseDe(e))).length
	// Par défaut : la première étape pas encore remplie.
	const courante = etapes.find((e) => e['@id'] === etapeChoisie) ?? etapes.find((e) => !estRemplie(reponseDe(e))) ?? etapes[0]
	const index = courante ? etapes.indexOf(courante) : -1

	return (
		<div className="workspace-panel conception-panel">
			<aside className="conception-etapes">
				<div className="workspace-panel-heading">
					<div><span className="book-kicker">{(methode.data.nom ?? 'Méthode').toUpperCase()}</span><h2>{faites} / {etapes.length} étapes</h2></div>
				</div>
				<div className="goal-track conception-progression"><span style={{ width: `${etapes.length ? Math.round((faites / etapes.length) * 100) : 0}%` }} /></div>
				<ol>
					{etapes.map((etape) => {
						const remplie = estRemplie(reponseDe(etape))
						return (
							<li key={etape['@id']}>
								<button type="button" className={`conception-etape ${etape === courante ? 'selected' : ''} ${remplie ? 'remplie' : ''}`} onClick={() => setEtapeChoisie(etape['@id'])}>
									<span className="conception-numero">{remplie ? <Check size={11} /> : etape.position}</span>
									{etape.titre}
								</button>
							</li>
						)
					})}
				</ol>
				<button type="button" className="text-action" onClick={onChangerMethode}>Changer de méthode</button>
			</aside>

			<section className="conception-contenu">
				{courante && (
					<EtapeEditeur
						key={courante['@id']}
						projet={projet}
						methode={methode.data}
						etape={courante}
						reponse={reponseDe(courante)}
						precedente={index > 0 ? () => setEtapeChoisie(etapes[index - 1]['@id']) : undefined}
						suivante={index < etapes.length - 1 ? () => setEtapeChoisie(etapes[index + 1]['@id']) : undefined}
						onEcrire={onEcrire}
					/>
				)}
			</section>
		</div>
	)
}

interface EtapeEditeurProps {
	projet: Projet
	methode: Methode
	etape: MethodeEtape
	reponse: ReponseEtape | undefined
	precedente?: () => void
	suivante?: () => void
	onEcrire: () => void
}

function EtapeEditeur({ projet, methode, etape, reponse, precedente, suivante, onEcrire }: EtapeEditeurProps) {
	const brouillon = useReponseAutosauvegardee(projet['@id'], etape['@id'], reponse)
	const supprimer = useSupprimerReponse(projet['@id'])
	const avecFiches = etape.code === 'personnages' || Array.isArray(brouillon.contenu.personnages)
	const derniere = !suivante

	return (
		<>
			<div className="conception-entete">
				<span className="book-kicker">ÉTAPE {etape.position} · {(methode.nom ?? '').toUpperCase()}</span>
				<IndicateurEnregistrement etat={brouillon.etat} erreur={brouillon.erreur} onReessayer={brouillon.reessayer} />
			</div>
			<h2 className="conception-titre">{etape.titre}</h2>
			{etape.consigne && <p className="conception-consigne">{etape.consigne}</p>}

			{avecFiches ? (
				<FichesPersonnages projetIri={projet['@id']} fiches={brouillon.contenu.personnages ?? []} onChange={(personnages) => brouillon.modifier({ ...brouillon.contenu, personnages })} />
			) : (
				<textarea
					className="conception-texte"
					aria-label={`Votre réponse : ${etape.titre}`}
					placeholder="Écrivez librement : vous pourrez revenir sur cette étape à tout moment."
					value={brouillon.contenu.texte ?? ''}
					onChange={(e) => brouillon.modifier({ ...brouillon.contenu, texte: e.target.value } satisfies ContenuReponse)}
				/>
			)}

			{supprimer.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(supprimer.error)}</p>}

			<div className="conception-navigation">
				<button type="button" className="secondary-button" disabled={!precedente} onClick={precedente}><ArrowLeft size={14} /> Étape précédente</button>
				{reponse && (
					<button type="button" className="text-action conception-effacer" disabled={supprimer.isPending || brouillon.etat === 'envoi'} onClick={() => supprimer.mutate(reponse, { onSuccess: brouillon.reinitialiser })}>
						<Trash2 size={13} /> Effacer la réponse
					</button>
				)}
				{derniere
					? <button type="button" className="primary-button" onClick={onEcrire}>Passer à l’écriture <ArrowRight size={14} /></button>
					: <button type="button" className="primary-button" onClick={suivante}>Étape suivante <ArrowRight size={14} /></button>}
			</div>
		</>
	)
}

const champsFiche: { cle: keyof FichePersonnage; libelle: string }[] = [
	{ cle: 'objectif', libelle: 'Objectif' },
	{ cle: 'motivation', libelle: 'Motivation' },
	{ cle: 'conflit', libelle: 'Conflit' },
	{ cle: 'apprentissage', libelle: 'Ce qu’il apprend' },
]

function FichesPersonnages({ projetIri, fiches, onChange }: { projetIri: string; fiches: FichePersonnage[]; onChange: (fiches: FichePersonnage[]) => void }) {
	const entites = useEntites(projetIri)
	const creerFiche = useCreerEntite(projetIri)
	const existe = (nom: string) => entites.data?.some((e) => e.type === 'personnage' && e.nom.trim().toLowerCase() === nom.trim().toLowerCase())

	/** Crée la fiche d'univers correspondante ; les réponses deviennent ses détails. */
	function versUnivers(fiche: FichePersonnage) {
		const donnees = Object.fromEntries(champsFiche.map(({ cle }) => [cle, (fiche[cle] as string | undefined)?.trim()]).filter(([, v]) => v))
		creerFiche.mutate({ type: 'personnage', nom: fiche.nom.trim(), donnees })
	}

	const changer = (index: number, cle: keyof FichePersonnage, valeur: string) => onChange(fiches.map((f, i) => (i === index ? { ...f, [cle]: valeur } : f)))

	return (
		<div className="conception-fiches">
			{fiches.map((fiche, index) => (
				<fieldset className="conception-fiche" key={index}>
					<legend className="sr-only">Personnage {index + 1}</legend>
					<div className="conception-fiche-entete">
						<input className="conception-fiche-nom" placeholder="Nom du personnage" aria-label={`Nom du personnage ${index + 1}`} value={fiche.nom ?? ''} onChange={(e) => changer(index, 'nom', e.target.value)} />
						{fiche.nom?.trim() && entites.isSuccess && (existe(fiche.nom)
							? <span className="conception-fiche-lien"><Check size={12} /> Dans l’univers</span>
							: <button type="button" className="text-action" disabled={creerFiche.isPending} onClick={() => versUnivers(fiche)}><UserPlus size={13} /> Créer la fiche</button>)}
						<button type="button" className="icon-button" aria-label={`Retirer ${fiche.nom || `le personnage ${index + 1}`}`} onClick={() => onChange(fiches.filter((_, i) => i !== index))}><Trash2 size={14} /></button>
					</div>
					{champsFiche.map(({ cle, libelle }) => (
						<label key={cle}>
							{libelle}
							<textarea rows={2} value={(fiche[cle] as string | undefined) ?? ''} onChange={(e) => changer(index, cle, e.target.value)} />
						</label>
					))}
				</fieldset>
			))}
			{creerFiche.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(creerFiche.error)}</p>}
			<button type="button" className="ajout-rapide-bouton" onClick={() => onChange([...fiches, { nom: '' }])}><Plus size={13} /> Ajouter un personnage</button>
		</div>
	)
}

function IndicateurEnregistrement({ etat, erreur, onReessayer }: { etat: EtatEnregistrement; erreur: unknown; onReessayer: () => void }) {
	if (etat === 'enregistre') return <span className="saved-state"><i />Enregistré</span>
	if (etat === 'en_attente') return <span className="unsaved-state"><i />Modifications en attente</span>
	if (etat === 'envoi') return <span className="unsaved-state"><LoaderCircle size={11} className="projet-spinner" />Enregistrement…</span>
	return (
		<span className="sync-erreur" title={getErrorMessage(erreur)}>
			<AlertTriangle size={12} />{getErrorMessage(erreur)}
			<button type="button" className="text-action" onClick={onReessayer}>Réessayer</button>
		</span>
	)
}

export default ConceptionPage
