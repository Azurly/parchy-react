import { Flame, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import type { Projet } from '@/features/projets/api'
import { useSessions } from '../hooks'
import { calculerRythme, objectifHebdomadaire } from '../rythme'

const nombre = new Intl.NumberFormat('fr-FR')

/**
 * « Mon rythme » : mots écrits chaque jour de la semaine (sessions d'écriture),
 * objectif de la semaine déduit de l'objectif et de la date cible du projet, série de jours.
 */
function RythmePanel({ projet, motsEcrits }: { projet: Projet | null; motsEcrits: number }) {
	const sessions = useSessions(projet?.['@id'])
	const rythme = calculerRythme(sessions.data ?? [])
	const objectif = objectifHebdomadaire(projet?.objectifMots, projet?.dateCible, motsEcrits)
	const progression = objectif ? Math.round((rythme.totalSemaine / objectif) * 100) : null
	const maximum = Math.max(...rythme.jours.map((j) => j.mots), objectif ? objectif / 7 : 0, 1)

	return (
		<>
			<article className="goal-panel">
				<div className="panel-topline">
					<div className="section-label"><span className="section-icon goal-icon"><Target size={15} /></span> MON RYTHME</div>
					<span className="period-button">Cette semaine</span>
				</div>

				{sessions.isPending && projet ? <Skeleton className="h-36 w-full rounded-md" /> : (
					<>
						<div className="goal-numbers">
							<strong>{nombre.format(rythme.totalSemaine)}</strong>
							<span>{objectif ? ` / ${nombre.format(objectif)} mots` : ` mot${rythme.totalSemaine > 1 ? 's' : ''} cette semaine`}</span>
						</div>
						{progression !== null && (
							<>
								<div className="goal-track"><span style={{ width: `${Math.min(progression, 100)}%` }} /></div>
								<div className="goal-foot">
									<span>{progression >= 100 ? 'Objectif de la semaine atteint !' : `Encore ${nombre.format(Math.max(objectif! - rythme.totalSemaine, 0))} mots pour tenir votre date cible`}</span>
									<strong>{progression} %</strong>
								</div>
							</>
						)}
						{progression === null && projet && (
							<p className="goal-foot"><span>Ajoutez un objectif de mots et une date cible à votre projet pour obtenir un objectif hebdomadaire.</span></p>
						)}
						{sessions.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(sessions.error)}</p>}
						<div className="week-chart" aria-label="Mots écrits chaque jour cette semaine">
							{rythme.jours.map((jour, index) => (
								<div className="day-column" key={index} title={`${nombre.format(jour.mots)} mots`}>
									<div className="bar-track"><span className={jour.aujourdhui ? 'bar-current' : ''} style={{ height: `${Math.max((jour.mots / maximum) * 100, jour.mots ? 10 : 3)}%` }} /></div>
									<span className={jour.aujourdhui ? 'current-day' : ''}>{jour.lettre}</span>
								</div>
							))}
						</div>
					</>
				)}
			</article>

			<article className="streak-strip">
				<span className="streak-icon"><Flame size={18} fill="currentColor" /></span>
				<span>
					<strong>{rythme.serie} jour{rythme.serie > 1 ? 's' : ''}</strong>
					<small>{rythme.serie > 0 ? 'd’écriture d’affilée' : 'Écrivez aujourd’hui pour lancer une série'}</small>
				</span>
				<div className="streak-dots" aria-hidden="true">
					{rythme.jours.map((jour, index) => <i key={index} className={[jour.mots > 0 ? 'done-streak' : '', jour.aujourdhui ? 'today-streak' : ''].join(' ').trim() || undefined} />)}
				</div>
			</article>
		</>
	)
}

export default RythmePanel
