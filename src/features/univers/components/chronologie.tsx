import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, LoaderCircle, PenLine, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import type { Evenement } from '../api'
import { useCreerEvenement, useEchangerEvenements, useEntites, useEvenements, useModifierEvenement, useSupprimerEvenement } from '../hooks'

/** Repères chronologiques du projet, dans l'ordre de l'histoire. */
function Chronologie({ projetIri }: { projetIri: string }) {
	const evenements = useEvenements(projetIri)
	const entites = useEntites(projetIri)
	const echanger = useEchangerEvenements(projetIri)
	const supprimer = useSupprimerEvenement(projetIri)
	const [edition, setEdition] = useState<Evenement | 'nouveau' | null>(null)
	const liste = evenements.data ?? []
	const positionLibre = Math.max(0, ...liste.map((e) => e.position)) + 1
	const nomDe = (iri: string) => entites.data?.find((e) => e['@id'] === iri)?.nom
	const erreur = echanger.error ?? supprimer.error ?? evenements.error

	return (
		<>
			<div className="chronologie-actions">
				<button type="button" className="primary-button" onClick={() => setEdition('nouveau')}><Plus size={14} /> Nouvel événement</button>
			</div>
			{erreur && <p className="manuscrit-erreur" role="alert">{getErrorMessage(erreur)}</p>}
			{evenements.isPending && [0, 1].map((i) => <Skeleton key={i} className="my-2 h-12 w-full rounded-md" />)}
			{evenements.isSuccess && liste.length === 0 && <p className="empty-state">Aucun repère chronologique pour l’instant.</p>}

			<ol className="chronologie">
				{liste.map((evenement, index) => {
					const lies = evenement.entites.map(nomDe).filter(Boolean)
					return (
						<li className="univers-ligne" key={evenement['@id']}>
							<span className="universe-entry-icon place-entry"><CalendarDays size={17} /></span>
							<span>
								<strong>{evenement.titre}</strong>
								<small>{[evenement.libelleDate, evenement.description].filter(Boolean).join(' · ') || 'Sans date'}</small>
								{lies.length > 0 && <small className="chronologie-lies">Avec {lies.join(', ')}</small>}
							</span>
							<span className="plan-actions univers-date">
								<button type="button" className="icon-button" aria-label="Avancer dans la chronologie" disabled={echanger.isPending || index === 0} onClick={() => echanger.mutate({ a: evenement, b: liste[index - 1], positionLibre })}><ArrowUp size={13} /></button>
								<button type="button" className="icon-button" aria-label="Reculer dans la chronologie" disabled={echanger.isPending || index === liste.length - 1} onClick={() => echanger.mutate({ a: evenement, b: liste[index + 1], positionLibre })}><ArrowDown size={13} /></button>
								<button type="button" className="icon-button" aria-label={`Modifier ${evenement.titre}`} onClick={() => setEdition(evenement)}><PenLine size={13} /></button>
								<button type="button" className="icon-button" aria-label={`Supprimer ${evenement.titre}`} disabled={supprimer.isPending} onClick={() => { if (window.confirm(`Supprimer l’événement « ${evenement.titre} » ?`)) supprimer.mutate(evenement['@id']) }}><Trash2 size={13} /></button>
							</span>
						</li>
					)
				})}
			</ol>

			{edition && (
				<EvenementDialog
					projetIri={projetIri}
					evenement={edition === 'nouveau' ? undefined : edition}
					positionLibre={positionLibre}
					onClose={() => setEdition(null)}
				/>
			)}
		</>
	)
}

function EvenementDialog({ projetIri, evenement, positionLibre, onClose }: { projetIri: string; evenement?: Evenement; positionLibre: number; onClose: () => void }) {
	const entites = useEntites(projetIri)
	const creer = useCreerEvenement(projetIri)
	const modifier = useModifierEvenement(projetIri)
	const mutation = evenement ? modifier : creer
	const [titre, setTitre] = useState(evenement?.titre ?? '')
	const [libelleDate, setLibelleDate] = useState(evenement?.libelleDate ?? '')
	const [description, setDescription] = useState(evenement?.description ?? '')
	const [lies, setLies] = useState<string[]>(evenement?.entites ?? [])
	const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {}

	function basculer(iri: string) {
		setLies(lies.includes(iri) ? lies.filter((l) => l !== iri) : [...lies, iri])
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (mutation.isPending) return
		const champs = { titre: titre.trim(), libelleDate: libelleDate.trim() || null, description: description.trim() || null, entites: lies }
		if (evenement) modifier.mutate({ iri: evenement['@id'], modification: champs }, { onSuccess: onClose })
		else creer.mutate({ ...champs, position: positionLibre }, { onSuccess: onClose })
	}

	const fiches = [...(entites.data ?? [])].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog">
				<DialogHeader>
					<DialogTitle>{evenement ? 'Modifier l’événement' : 'Nouvel événement'}</DialogTitle>
					<DialogDescription>Un repère de votre chronologie. Le nouvel événement est ajouté à la fin ; réordonnez-le ensuite avec les flèches.</DialogDescription>
				</DialogHeader>
				<form className="projet-form" onSubmit={handleSubmit}>
					<label>
						Titre
						<input required maxLength={255} value={titre} onChange={(e) => setTitre(e.target.value)} autoFocus aria-invalid={Boolean(fieldErrors.titre)} />
						{fieldErrors.titre && <span className="projet-field-error">{fieldErrors.titre}</span>}
					</label>
					<label>
						Date dans l’histoire
						<input maxLength={255} value={libelleDate} onChange={(e) => setLibelleDate(e.target.value)} placeholder="An 312, hiver ; Trois jours avant le bal…" />
					</label>
					<label>
						Description
						<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
					</label>
					{fiches.length > 0 && (
						<fieldset className="chronologie-fiches">
							<legend>Fiches concernées</legend>
							{fiches.map((fiche) => (
								<label key={fiche['@id']}><input type="checkbox" checked={lies.includes(fiche['@id'])} onChange={() => basculer(fiche['@id'])} /> {fiche.nom}</label>
							))}
						</fieldset>
					)}
					{fieldErrors.entites && <p className="projet-form-error">{fieldErrors.entites}</p>}
					{mutation.isError && !Object.keys(fieldErrors).length && <p className="projet-form-error" role="alert">{getErrorMessage(mutation.error)}</p>}
					<div className="projet-form-actions">
						<button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
						<button type="submit" className="primary-button" disabled={mutation.isPending}>
							{mutation.isPending && <LoaderCircle size={14} className="projet-spinner" />}
							{evenement ? 'Enregistrer' : 'Ajouter'}
						</button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default Chronologie
