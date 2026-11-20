import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import type { Projet, ProjetEntree, StatutProjet } from '../api'
import { useCreerProjet, useMethodes, useModifierProjet } from '../hooks'
import { statutsProjet } from '../libelles'
import './projets.css'

interface ProjetFormProps {
	/** Projet à modifier ; absent pour une création. */
	projet?: Projet
	onClose: () => void
	onSaved: (projet: Projet) => void
}

/** Formulaire de création ou de modification d'un projet, dans une fenêtre. */
function ProjetForm({ projet, onClose, onSaved }: ProjetFormProps) {
	const [titre, setTitre] = useState(projet?.titre ?? '')
	const [genre, setGenre] = useState(projet?.genre ?? '')
	const [pitch, setPitch] = useState(projet?.pitch ?? '')
	const [methode, setMethode] = useState(projet?.methode ?? '')
	const [objectifMots, setObjectifMots] = useState(projet?.objectifMots?.toString() ?? '')
	const [dateCible, setDateCible] = useState(projet?.dateCible?.slice(0, 10) ?? '')
	const [statut, setStatut] = useState<StatutProjet>(projet?.statut ?? 'conception')
	const methodes = useMethodes()
	const creer = useCreerProjet()
	const modifier = useModifierProjet()
	const mutation = projet ? modifier : creer

	const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {}
	const hasFieldErrors = Object.keys(fieldErrors).some((field) => field !== '_global')
	const globalError = mutation.error ? fieldErrors._global ?? (hasFieldErrors ? '' : getErrorMessage(mutation.error)) : ''

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (mutation.isPending) return

		const entree: ProjetEntree = {
			titre: titre.trim(),
			genre: genre.trim() || null,
			pitch: pitch.trim() || null,
			methode: methode || null,
			objectifMots: objectifMots === '' ? null : Number(objectifMots),
			dateCible: dateCible || null,
			statut,
		}
		const options = { onSuccess: (enregistre: Projet) => onSaved(enregistre) }

		if (projet) modifier.mutate({ iri: projet['@id'], modification: entree }, options)
		else creer.mutate(entree, options)
	}

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="projet-dialog">
				<DialogHeader>
					<DialogTitle>{projet ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
					<DialogDescription>
						{projet ? 'Mettez à jour les informations de votre roman.' : 'Seul le titre est obligatoire : le reste peut attendre.'}
					</DialogDescription>
				</DialogHeader>

				<form className="projet-form" onSubmit={handleSubmit}>
					<label>
						Titre
						<input required maxLength={255} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Le titre de votre roman" autoFocus aria-invalid={Boolean(fieldErrors.titre)} />
						{fieldErrors.titre && <span className="projet-field-error">{fieldErrors.titre}</span>}
					</label>
					<div className="projet-form-row">
						<label>
							Genre
							<input maxLength={100} value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Fantastique, polar…" aria-invalid={Boolean(fieldErrors.genre)} />
							{fieldErrors.genre && <span className="projet-field-error">{fieldErrors.genre}</span>}
						</label>
						<label>
							Statut
							<select value={statut} onChange={(e) => setStatut(e.target.value as StatutProjet)}>
								{statutsProjet.map((s) => <option key={s.valeur} value={s.valeur}>{s.libelle}</option>)}
							</select>
						</label>
					</div>
					<label>
						Pitch
						<textarea maxLength={500} rows={3} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Votre histoire en quelques phrases" aria-invalid={Boolean(fieldErrors.pitch)} />
						<span className="projet-field-hint">{pitch.length} / 500</span>
						{fieldErrors.pitch && <span className="projet-field-error">{fieldErrors.pitch}</span>}
					</label>
					<label>
						Méthode d’écriture
						<select value={methode} onChange={(e) => setMethode(e.target.value)} disabled={methodes.isPending}>
							<option value="">Aucune méthode</option>
							{methodes.data?.map((m) => <option key={m['@id']} value={m['@id']}>{m.nom}</option>)}
						</select>
						{methodes.isError && <span className="projet-field-error">Les méthodes n’ont pas pu être chargées.</span>}
						{fieldErrors.methode && <span className="projet-field-error">{fieldErrors.methode}</span>}
					</label>
					<div className="projet-form-row">
						<label>
							Objectif (mots)
							<input type="number" min={0} step={1000} value={objectifMots} onChange={(e) => setObjectifMots(e.target.value)} placeholder="80 000" aria-invalid={Boolean(fieldErrors.objectifMots)} />
							{fieldErrors.objectifMots && <span className="projet-field-error">{fieldErrors.objectifMots}</span>}
						</label>
						<label>
							Date cible
							<input type="date" value={dateCible} onChange={(e) => setDateCible(e.target.value)} aria-invalid={Boolean(fieldErrors.dateCible)} />
							{fieldErrors.dateCible && <span className="projet-field-error">{fieldErrors.dateCible}</span>}
						</label>
					</div>

					{globalError && <p className="projet-form-error" role="alert">{globalError}</p>}

					<div className="projet-form-actions">
						<button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
						<button type="submit" className="primary-button" disabled={mutation.isPending}>
							{mutation.isPending && <LoaderCircle size={14} className="projet-spinner" />}
							{projet ? 'Enregistrer' : 'Créer le projet'}
						</button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default ProjetForm
