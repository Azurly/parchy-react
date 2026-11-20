import { useState, type FormEvent } from 'react'
import { Clock3, Flame, PenLine, Target, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import type { Projet } from '@/features/projets/api'
import { useModifierProjet, useProjetActif } from '@/features/projets/hooks'
import { formaterDate } from '@/features/projets/libelles'
import { useChapitres } from '@/features/chapitres/hooks'
import { useSessions } from '../hooks'
import { calculerRythme, joursRecents, meilleureSerie, objectifHebdomadaire, projection } from '../rythme'
import GraphiqueJours from './graphique-jours'
import './suivi.css'

const nombre = new Intl.NumberFormat('fr-FR')
const dateHeure = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function duree(minutes: number): string {
	if (minutes < 60) return `${Math.round(minutes)} min`
	const h = Math.floor(minutes / 60)
	const m = Math.round(minutes % 60)
	return m ? `${h} h ${m}` : `${h} h`
}

function SuiviPage({ onCreerProjet }: { onCreerProjet: () => void }) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const sessions = useSessions(projetIri)
	const chapitres = useChapitres(projetIri)

	if (!projet || !projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour suivre votre progression.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	if (sessions.isPending || chapitres.isPending) return <div className="workspace-panel"><Skeleton className="h-72 w-full rounded-md" /></div>
	if (sessions.isError || chapitres.isError) return <p className="manuscrit-erreur" role="alert">{getErrorMessage(sessions.error ?? chapitres.error)}</p>

	const liste = sessions.data
	const motsEcrits = chapitres.data.reduce((total, c) => total + (c.nombreMots ?? 0), 0)
	const rythme = calculerRythme(liste)
	const trente = joursRecents(liste, 30)
	const quatorze = trente.slice(-14)
	const moyenne = quatorze.reduce((t, j) => t + j.mots, 0) / 14
	const minutesMois = trente.reduce((t, j) => t + j.minutes, 0)
	const objectifSemaine = objectifHebdomadaire(projet.objectifMots, projet.dateCible, motsEcrits)
	const fin = projection(projet.objectifMots, motsEcrits, moyenne)
	const avancement = projet.objectifMots ? Math.min(100, Math.round((motsEcrits / projet.objectifMots) * 100)) : null
	const recentes = [...liste].sort((a, b) => b.debut.localeCompare(a.debut)).slice(0, 8)

	return (
		<>
			<div className="suivi-tuiles">
				<Tuile icone={PenLine} valeur={nombre.format(motsEcrits)} libelle="mots dans le manuscrit" detail={avancement === null ? 'Pas encore d’objectif' : `${avancement} % de l’objectif`} />
				<Tuile icone={Target} valeur={nombre.format(rythme.totalSemaine)} libelle="mots cette semaine" detail={objectifSemaine ? `Objectif : ${nombre.format(objectifSemaine)}` : 'Fixez une date cible'} />
				<Tuile icone={Flame} valeur={`${rythme.serie} j`} libelle="série en cours" detail={`Record : ${meilleureSerie(liste)} j`} />
				<Tuile icone={Clock3} valeur={duree(minutesMois)} libelle="d’écriture en 30 jours" detail={`${liste.length} session${liste.length > 1 ? 's' : ''} au total`} />
			</div>

			<div className="workspace-panel">
				<GraphiqueJours jours={trente} titre="Mots écrits par jour, 30 derniers jours" />
				<p className="suivi-projection">
					<TrendingUp size={14} />
					{moyenne > 0
						? <>Rythme moyen sur 14 jours : <strong>{nombre.format(Math.round(moyenne))} mots par jour</strong>.{fin && <> À ce rythme, vous atteindrez votre objectif vers le <strong>{formaterDate(fin.toISOString())}</strong>{projet.dateCible && new Date(projet.dateCible) < fin ? ', après votre date cible.' : '.'}</>}</>
						: 'Pas encore assez de sessions pour estimer votre rythme.'}
				</p>
			</div>

			<div className="suivi-colonnes">
				<ObjectifForm key={projetIri} projet={projet} />

				<div className="workspace-panel">
					<div className="workspace-panel-heading"><div><span className="book-kicker">HISTORIQUE</span><h2>Dernières sessions</h2></div></div>
					{recentes.length === 0 ? <p className="empty-state">Vos sessions apparaîtront ici dès que vous écrirez dans le manuscrit.</p> : (
						<table className="suivi-sessions">
							<thead><tr><th scope="col">Début</th><th scope="col">Durée</th><th scope="col">Mots</th></tr></thead>
							<tbody>
								{recentes.map((s) => (
									<tr key={s['@id']}>
										<td>{dateHeure.format(new Date(s.debut))}</td>
										<td>{s.fin ? duree((new Date(s.fin).getTime() - new Date(s.debut).getTime()) / 60000) : 'En cours'}</td>
										<td className={(s.motsAjoutes ?? 0) < 0 ? 'negatif' : ''}>{(s.motsAjoutes ?? 0) > 0 ? '+' : ''}{nombre.format(s.motsAjoutes ?? 0)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
					<p className="suivi-aide">Une session est enregistrée automatiquement quand vous écrivez dans le manuscrit ; elle se termine après 30 minutes sans écrire.</p>
				</div>
			</div>
		</>
	)
}

function Tuile({ icone: Icone, valeur, libelle, detail }: { icone: typeof PenLine; valeur: string; libelle: string; detail: string }) {
	return (
		<div className="workspace-panel suivi-tuile">
			<span className="section-icon goal-icon"><Icone size={15} /></span>
			<strong>{valeur}</strong>
			<span>{libelle}</span>
			<small>{detail}</small>
		</div>
	)
}

/** Objectif de mots et date cible du projet (PATCH projet). */
function ObjectifForm({ projet }: { projet: Projet }) {
	const modifier = useModifierProjet()
	const [objectif, setObjectif] = useState(projet.objectifMots?.toString() ?? '')
	const [date, setDate] = useState(projet.dateCible?.slice(0, 10) ?? '')
	const erreurs = modifier.error instanceof ApiError ? modifier.error.fieldErrors : {}
	const inchange = objectif === (projet.objectifMots?.toString() ?? '') && date === (projet.dateCible?.slice(0, 10) ?? '')

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		modifier.mutate({ iri: projet['@id'], modification: { objectifMots: objectif === '' ? null : Number(objectif), dateCible: date || null } })
	}

	return (
		<form className="workspace-panel projet-form suivi-objectif" onSubmit={handleSubmit}>
			<div className="workspace-panel-heading"><div><span className="book-kicker">OBJECTIF</span><h2>{projet.titre}</h2></div></div>
			<label>
				Nombre de mots visé
				<input type="number" min={0} step={1000} value={objectif} onChange={(e) => setObjectif(e.target.value)} placeholder="80 000" aria-invalid={Boolean(erreurs.objectifMots)} />
				{erreurs.objectifMots && <span className="projet-field-error">{erreurs.objectifMots}</span>}
			</label>
			<label>
				Date cible
				<input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(erreurs.dateCible)} />
				{erreurs.dateCible && <span className="projet-field-error">{erreurs.dateCible}</span>}
			</label>
			<p className="suivi-aide">Avec une date cible, Parchy répartit les mots restants en objectif de la semaine.</p>
			{modifier.isError && !Object.keys(erreurs).length && <p className="projet-form-error" role="alert">{getErrorMessage(modifier.error)}</p>}
			{modifier.isSuccess && inchange && <p className="versions-ok" role="status">Objectif enregistré.</p>}
			<div className="projet-form-actions">
				<button type="submit" className="primary-button" disabled={modifier.isPending || inchange}>{modifier.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
			</div>
		</form>
	)
}

export default SuiviPage
