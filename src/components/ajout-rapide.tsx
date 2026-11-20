import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

interface AjoutRapideProps {
	libelle: string
	placeholder: string
	enCours?: boolean
	erreur?: string
	onAjouter: (titre: string) => Promise<unknown> | void
	className?: string
}

/** Bouton « + Ajouter… » qui se transforme en champ de saisie d'un titre. */
function AjoutRapide({ libelle, placeholder, enCours, erreur, onAjouter, className = '' }: AjoutRapideProps) {
	const [ouvert, setOuvert] = useState(false)
	const [titre, setTitre] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (enCours) return
		try {
			await onAjouter(titre.trim())
			setTitre('')
			setOuvert(false)
		} catch {
			// L'erreur est affichée via `erreur`.
		}
	}

	if (!ouvert) {
		return <button type="button" className={`ajout-rapide-bouton ${className}`} onClick={() => setOuvert(true)}><Plus size={13} /> {libelle}</button>
	}

	return (
		<form className={`ajout-rapide ${className}`} onSubmit={handleSubmit}>
			<input autoFocus maxLength={255} value={titre} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setTitre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setOuvert(false) }} />
			<button type="submit" className="primary-button" disabled={enCours}>{enCours ? '…' : 'Ajouter'}</button>
			{erreur && <span className="ajout-rapide-erreur" role="alert">{erreur}</span>}
		</form>
	)
}

export default AjoutRapide
