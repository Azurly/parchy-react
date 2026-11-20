import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import type { Donnees, Entite, TypeEntite } from '../api'
import { useCreerEntite, useCreerRelation, useEntites, useModifierEntite, useRelations, useSupprimerEntite, useSupprimerRelation } from '../hooks'
import { champsSuggeres, libelleChamp, libelleType, typesEntite } from '../libelles'

interface FicheDialogProps {
	projetIri: string
	/** Fiche à modifier ; absente pour une création. */
	entite?: Entite
	typeInitial?: TypeEntite
	onClose: () => void
	onMessage?: (message: string) => void
}

interface Ligne {
	cle: string
	valeur: string
	/** Valeur numérique d'origine (âge…) : on la renvoie en nombre si elle reste numérique. */
	numerique: boolean
	/** Détail proposé ou déjà enregistré : son nom n'est pas modifiable. */
	fixe: boolean
}

function versLignes(donnees: Donnees | undefined): Ligne[] {
	return Object.entries(donnees ?? {})
		.filter(([, v]) => typeof v === 'string' || typeof v === 'number')
		.map(([cle, v]) => ({ cle, valeur: String(v), numerique: typeof v === 'number', fixe: true }))
}

function versDonnees(lignes: Ligne[], origine: Donnees | undefined): Donnees {
	// Les valeurs non éditables ici (listes, objets) sont conservées telles quelles.
	const conservees = Object.fromEntries(Object.entries(origine ?? {}).filter(([, v]) => typeof v !== 'string' && typeof v !== 'number'))
	const editees = Object.fromEntries(lignes
		.filter((l) => l.cle.trim() && l.valeur.trim())
		.map((l) => {
			const valeur = l.valeur.trim()
			const enNombre = (l.numerique || l.cle === 'age') && /^\d+$/.test(valeur)
			return [l.cle.trim(), enNombre ? Number(valeur) : valeur]
		}))
	return { ...conservees, ...editees }
}

function FicheDialog({ projetIri, entite, typeInitial = 'personnage', onClose, onMessage }: FicheDialogProps) {
	const [type, setType] = useState<TypeEntite>(entite?.type ?? typeInitial)
	const [nom, setNom] = useState(entite?.nom ?? '')
	const [resume, setResume] = useState(entite?.resume ?? '')
	const [lignes, setLignes] = useState<Ligne[]>(() => {
		const existantes = versLignes(entite?.donnees as Donnees | undefined)
		return existantes.length ? existantes : champsSuggeres(entite?.type ?? typeInitial).map((cle) => ({ cle, valeur: '', numerique: false, fixe: true }))
	})
	const [confirmerSuppression, setConfirmerSuppression] = useState(false)
	const creer = useCreerEntite(projetIri)
	const modifier = useModifierEntite(projetIri)
	const supprimer = useSupprimerEntite(projetIri)
	const mutation = entite ? modifier : creer
	const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {}

	function changerType(nouveau: TypeEntite) {
		setType(nouveau)
		// Champs vides suggérés : on les remplace par ceux du nouveau type.
		const remplies = lignes.filter((l) => l.valeur.trim())
		const suggeres = champsSuggeres(nouveau).filter((cle) => !remplies.some((l) => l.cle === cle)).map((cle) => ({ cle, valeur: '', numerique: false, fixe: true }))
		setLignes([...remplies, ...suggeres])
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (mutation.isPending) return
		const donnees = versDonnees(lignes, entite?.donnees as Donnees | undefined)
		const champs = { nom: nom.trim(), resume: resume.trim() || null, donnees }
		if (entite) {
			modifier.mutate({ iri: entite['@id'], modification: champs }, { onSuccess: () => { onMessage?.(`Fiche « ${champs.nom} » enregistrée.`); onClose() } })
		} else {
			creer.mutate({ type, ...champs }, { onSuccess: () => { onMessage?.(`Fiche « ${champs.nom} » créée.`); onClose() } })
		}
	}

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog fiche-dialog">
				<DialogHeader>
					<DialogTitle>{entite ? entite.nom : `Nouvelle fiche`}</DialogTitle>
					<DialogDescription>{entite ? libelleType(entite.type) : 'Personnage, lieu, objet… tout ce qui fait vivre votre histoire.'}</DialogDescription>
				</DialogHeader>

				<form className="projet-form" onSubmit={handleSubmit}>
					<div className="projet-form-row">
						<label>
							Nom
							<input required maxLength={255} value={nom} onChange={(e) => setNom(e.target.value)} autoFocus={!entite} aria-invalid={Boolean(fieldErrors.nom)} />
							{fieldErrors.nom && <span className="projet-field-error">{fieldErrors.nom}</span>}
						</label>
						<label>
							Type
							<select value={type} disabled={Boolean(entite)} onChange={(e) => changerType(e.target.value as TypeEntite)} title={entite ? 'Le type d’une fiche ne peut pas être changé.' : undefined}>
								{typesEntite.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
							</select>
						</label>
					</div>
					<label>
						Résumé
						<textarea rows={3} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="En quelques mots, qui ou qu’est-ce que c’est ?" />
					</label>

					<fieldset className="fiche-champs">
						<legend>Détails</legend>
						{lignes.map((ligne, index) => (
							<div className="fiche-champ" key={index}>
								<input
									className="fiche-champ-cle"
									aria-label="Nom du détail"
									placeholder="Détail"
									value={ligne.fixe ? libelleChamp(ligne.cle) : ligne.cle}
									readOnly={ligne.fixe}
									onChange={(e) => setLignes(lignes.map((l, i) => (i === index ? { ...l, cle: e.target.value } : l)))}
								/>
								<input aria-label={`Valeur : ${libelleChamp(ligne.cle) || 'détail'}`} value={ligne.valeur} onChange={(e) => setLignes(lignes.map((l, i) => (i === index ? { ...l, valeur: e.target.value } : l)))} />
								<button type="button" className="icon-button" aria-label="Retirer ce détail" onClick={() => setLignes(lignes.filter((_, i) => i !== index))}><X size={13} /></button>
							</div>
						))}
						<button type="button" className="ajout-rapide-bouton" onClick={() => setLignes([...lignes, { cle: '', valeur: '', numerique: false, fixe: false }])}><Plus size={13} /> Ajouter un détail</button>
					</fieldset>

					{mutation.isError && !Object.keys(fieldErrors).some((f) => f !== '_global') && <p className="projet-form-error" role="alert">{getErrorMessage(mutation.error)}</p>}

					<div className="projet-form-actions">
						{entite && !confirmerSuppression && (
							<button type="button" className="text-action fiche-supprimer" onClick={() => setConfirmerSuppression(true)}><Trash2 size={13} /> Supprimer la fiche</button>
						)}
						<button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
						<button type="submit" className="primary-button" disabled={mutation.isPending}>
							{mutation.isPending && <LoaderCircle size={14} className="projet-spinner" />}
							{entite ? 'Enregistrer' : 'Créer la fiche'}
						</button>
					</div>
				</form>

				{entite && confirmerSuppression && (
					<div className="fiche-confirmation" role="alertdialog" aria-label="Confirmer la suppression">
						<p>Supprimer « {entite.nom} » ? Ses relations, ses présences dans les scènes et ses liens avec la chronologie seront aussi supprimés.</p>
						{supprimer.isError && <p className="projet-form-error">{getErrorMessage(supprimer.error)}</p>}
						<div className="projet-form-actions">
							<button type="button" className="secondary-button" onClick={() => setConfirmerSuppression(false)}>Garder la fiche</button>
							<button type="button" className="primary-button danger-button" disabled={supprimer.isPending} onClick={() => supprimer.mutate(entite['@id'], { onSuccess: () => { onMessage?.(`« ${entite.nom} » a été supprimée.`); onClose() } })}>
								<Trash2 size={14} /> {supprimer.isPending ? 'Suppression…' : 'Supprimer'}
							</button>
						</div>
					</div>
				)}

				{entite && !confirmerSuppression && <RelationsFiche projetIri={projetIri} entite={entite} />}
			</DialogContent>
		</Dialog>
	)
}

const typesRelationSuggeres = ['allié de', 'ennemi de', 'parent de', 'enfant de', 'amoureux de', 'mentor de', 'membre de', 'vit à', 'possède', 'se trouve à']

/** Relations de la fiche avec les autres fiches du projet. */
function RelationsFiche({ projetIri, entite }: { projetIri: string; entite: Entite }) {
	const entites = useEntites(projetIri)
	const relations = useRelations(projetIri)
	const creer = useCreerRelation(projetIri)
	const supprimer = useSupprimerRelation(projetIri)
	const [cible, setCible] = useState('')
	const [typeRelation, setTypeRelation] = useState('')

	const iri = entite['@id']
	const nomDe = (autre: string) => entites.data?.find((e) => e['@id'] === autre)?.nom ?? 'Fiche supprimée'
	const liees = (relations.data ?? []).filter((r) => r.source === iri || r.cible === iri)
	const autres = (entites.data ?? []).filter((e) => e['@id'] !== iri).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
	const erreur = creer.error ?? supprimer.error ?? relations.error

	function ajouter(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!cible || !typeRelation.trim() || creer.isPending) return
		creer.mutate({ source: iri, cible, typeRelation: typeRelation.trim() }, { onSuccess: () => { setCible(''); setTypeRelation('') } })
	}

	return (
		<section className="fiche-relations" aria-label="Relations">
			<h3>Relations</h3>
			{relations.isSuccess && liees.length === 0 && <p className="empty-state">Aucune relation pour l’instant.</p>}
			<ul>
				{liees.map((relation) => {
					const sortante = relation.source === iri
					return (
						<li key={relation['@id']}>
							{sortante ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
							<span>
								{sortante
									? <>{entite.nom} est <strong>{relation.typeRelation}</strong> {nomDe(relation.cible)}</>
									: <>{nomDe(relation.source)} est <strong>{relation.typeRelation}</strong> {entite.nom}</>}
							</span>
							<button type="button" className="icon-button" aria-label="Supprimer la relation" disabled={supprimer.isPending} onClick={() => supprimer.mutate(relation['@id'])}><Trash2 size={13} /></button>
						</li>
					)
				})}
			</ul>
			{autres.length > 0 ? (
				<form className="fiche-relation-ajout" onSubmit={ajouter}>
					<span>{entite.nom} est</span>
					<input list="types-relation" aria-label="Type de relation" placeholder="allié de…" maxLength={100} value={typeRelation} onChange={(e) => setTypeRelation(e.target.value)} />
					<datalist id="types-relation">{typesRelationSuggeres.map((t) => <option key={t} value={t} />)}</datalist>
					<select aria-label="Fiche liée" value={cible} onChange={(e) => setCible(e.target.value)}>
						<option value="">Choisir une fiche…</option>
						{autres.map((e) => <option key={e['@id']} value={e['@id']}>{e.nom} ({libelleType(e.type).toLowerCase()})</option>)}
					</select>
					<button type="submit" className="primary-button" disabled={!cible || !typeRelation.trim() || creer.isPending}>Relier</button>
				</form>
			) : <p className="empty-state">Créez d’autres fiches pour les relier à celle-ci.</p>}
			{erreur && <p className="projet-form-error" role="alert">{erreur instanceof ApiError && Object.values(erreur.fieldErrors)[0] || getErrorMessage(erreur)}</p>}
		</section>
	)
}

export default FicheDialog
