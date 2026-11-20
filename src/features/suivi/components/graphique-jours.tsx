import { useState } from 'react'
import type { JourStat } from '../rythme'

const nombre = new Intl.NumberFormat('fr-FR')
const jourCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const jourLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const largeur = 600
const hauteur = 190
const marge = { haut: 14, bas: 24, gauche: 36, droite: 6 }
const rayon = 4

/** Barre aux extrémités de données arrondies (côté opposé à la ligne de base). */
function cheminBarre(x: number, y: number, l: number, h: number, versLeHaut: boolean): string {
	const r = Math.min(rayon, l / 2, h)
	if (h <= 0) return ''
	if (versLeHaut) {
		return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + l - r} Q${x + l},${y} ${x + l},${y + r} V${y + h} Z`
	}
	return `M${x},${y} V${y + h - r} Q${x},${y + h} ${x + r},${y + h} H${x + l - r} Q${x + l},${y + h} ${x + l},${y + h - r} V${y} Z`
}

/**
 * Mots écrits par jour (solde net). Une seule série : pas de légende, le titre la nomme.
 * Un jour négatif (plus de mots supprimés qu'écrits) descend sous la ligne de base.
 */
function GraphiqueJours({ jours, titre }: { jours: JourStat[]; titre: string }) {
	const [actif, setActif] = useState<number | null>(null)
	const max = Math.max(1, ...jours.map((j) => j.mots))
	const min = Math.min(0, ...jours.map((j) => j.mots))
	const zoneH = hauteur - marge.haut - marge.bas
	const zoneL = largeur - marge.gauche - marge.droite
	const echelle = zoneH / (max - min)
	const base = marge.haut + max * echelle
	const pas = zoneL / jours.length
	const barre = Math.max(3, Math.min(14, pas - 2))
	const survole = actif === null ? null : jours[actif]

	return (
		<figure className="graphique-jours">
			<figcaption className="graphique-titre">{titre}</figcaption>
			<div className="graphique-zone">
				<svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label={`${titre}. Le détail est disponible dans le tableau sous le graphique.`}>
					{/* Repère du maximum, discret */}
					<line x1={marge.gauche} x2={largeur - marge.droite} y1={marge.haut} y2={marge.haut} className="graphique-grille" />
					<text x={marge.gauche - 6} y={marge.haut + 3} className="graphique-axe" textAnchor="end">{nombre.format(max)}</text>
					<text x={marge.gauche - 6} y={base + 3} className="graphique-axe" textAnchor="end">0</text>
					{min < 0 && <text x={marge.gauche - 6} y={hauteur - marge.bas + 3} className="graphique-axe" textAnchor="end">{nombre.format(min)}</text>}

					{jours.map((jour, index) => {
						const x = marge.gauche + index * pas + (pas - barre) / 2
						const h = Math.abs(jour.mots) * echelle
						const positif = jour.mots >= 0
						const etiquette = index === jours.length - 1 ? 'Auj.' : index % 7 === 0 ? jourCourt.format(jour.date) : ''
						return (
							<g key={jour.cle}>
								<path d={cheminBarre(x, positif ? base - h : base, barre, h, positif)} className={`graphique-barre ${actif === index ? 'active' : ''} ${actif !== null && actif !== index ? 'attenuee' : ''}`} />
								{etiquette && <text x={x + barre / 2} y={hauteur - 6} className="graphique-axe" textAnchor="middle">{etiquette}</text>}
								{/* Zone de survol plus large que la barre, sur toute la hauteur */}
								<rect
									x={marge.gauche + index * pas}
									y={marge.haut}
									width={pas}
									height={zoneH}
									className="graphique-cible"
									tabIndex={0}
									aria-label={`${jourLong.format(jour.date)} : ${nombre.format(jour.mots)} mots`}
									onMouseEnter={() => setActif(index)}
									onMouseLeave={() => setActif(null)}
									onFocus={() => setActif(index)}
									onBlur={() => setActif(null)}
								/>
							</g>
						)
					})}
					<line x1={marge.gauche} x2={largeur - marge.droite} y1={base} y2={base} className="graphique-base" />
				</svg>
				{survole && (
					<div className="graphique-infobulle" style={{ left: `${((marge.gauche + (actif! + 0.5) * pas) / largeur) * 100}%` }} role="status">
						<strong>{nombre.format(survole.mots)} mots</strong>
						<span>{jourLong.format(survole.date)}</span>
						{survole.minutes > 0 && <span>{survole.minutes} min d’écriture</span>}
					</div>
				)}
			</div>
			<details className="graphique-donnees">
				<summary>Voir les données</summary>
				<table>
					<thead><tr><th scope="col">Jour</th><th scope="col">Mots</th><th scope="col">Minutes</th></tr></thead>
					<tbody>
						{[...jours].reverse().map((jour) => (
							<tr key={jour.cle}><td>{jourLong.format(jour.date)}</td><td>{nombre.format(jour.mots)}</td><td>{jour.minutes}</td></tr>
						))}
					</tbody>
				</table>
			</details>
		</figure>
	)
}

export default GraphiqueJours
