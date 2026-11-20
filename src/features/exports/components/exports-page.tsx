import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, LoaderCircle, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import { useCurrentUser } from '@/features/auth/hooks'
import { useProjetActif } from '@/features/projets/hooks'
import { formaterDate } from '@/features/projets/libelles'
import { useChapitres } from '@/features/chapitres/hooks'
import type { Export, FormatExport, StatutExport } from '../api'
import { useCreerExport, useExports, useSupprimerExport, useTelechargerExport } from '../hooks'
import './exports.css'

const formats: { valeur: FormatExport; libelle: string; detail: string }[] = [
	{ valeur: 'docx', libelle: 'Manuscrit Word (DOCX)', detail: 'Au format manuscrit normé, prêt à envoyer à un éditeur.' },
	{ valeur: 'epub', libelle: 'Livre numérique (EPUB)', detail: 'Pour relire votre roman sur liseuse ou téléphone.' },
]

const statuts: Record<StatutExport, { libelle: string; icone: typeof Clock3; classe: string }> = {
	en_attente: { libelle: 'En attente', icone: Clock3, classe: 'attente' },
	en_cours: { libelle: 'Génération en cours', icone: LoaderCircle, classe: 'attente' },
	termine: { libelle: 'Prêt', icone: CheckCircle2, classe: 'pret' },
	echoue: { libelle: 'Échec', icone: AlertTriangle, classe: 'echec' },
}

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Nom du fichier : le back ne rend pas son nom lisible par le navigateur (en-tête non exposé en CORS). */
function nomFichier(titre: string, exportation: Export): string {
	const base = titre.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'manuscrit'
	return `${base}-${(exportation.creeLe ?? new Date().toISOString()).slice(0, 10)}.${exportation.format ?? 'docx'}`
}

function ExportsPage({ onCreerProjet }: { onCreerProjet: () => void }) {
	const { projet } = useProjetActif()
	const projetIri = projet?.['@id']
	const exportsListe = useExports(projetIri)

	if (!projet || !projetIri) {
		return (
			<div className="workspace-panel manuscrit-vide">
				<p>Choisissez ou créez un projet pour exporter son manuscrit.</p>
				<button type="button" className="primary-button" onClick={onCreerProjet}>Voir mes projets</button>
			</div>
		)
	}

	return (
		<div className="exports-colonnes">
			<NouvelExport key={projetIri} projetIri={projetIri} />

			<div className="workspace-panel">
				<div className="workspace-panel-heading"><div><span className="book-kicker">{projet.titre.toUpperCase()}</span><h2>Vos exports</h2></div></div>
				{exportsListe.isPending && [0, 1].map((i) => <Skeleton key={i} className="my-2 h-14 w-full rounded-md" />)}
				{exportsListe.isError && <p className="manuscrit-erreur" role="alert">{getErrorMessage(exportsListe.error)}</p>}
				{exportsListe.isSuccess && exportsListe.data.length === 0 && <p className="empty-state">Aucun export pour l’instant.</p>}
				<ul className="exports-liste">
					{exportsListe.data?.map((exportation) => <LigneExport key={exportation['@id']} projetIri={projetIri} titre={projet.titre} exportation={exportation} />)}
				</ul>
				<p className="suivi-aide">Les fichiers restent disponibles 7 jours.</p>
			</div>
		</div>
	)
}

function NouvelExport({ projetIri }: { projetIri: string }) {
	const chapitres = useChapitres(projetIri)
	const utilisateur = useCurrentUser()
	const creer = useCreerExport(projetIri)
	const [format, setFormat] = useState<FormatExport>('docx')
	const [tous, setTous] = useState(true)
	const [choisis, setChoisis] = useState<string[]>([])
	const [auteur, setAuteur] = useState('')
	const erreurs = creer.error instanceof ApiError ? creer.error.fieldErrors : {}

	function basculer(iri: string) {
		setChoisis(choisis.includes(iri) ? choisis.filter((c) => c !== iri) : [...choisis, iri])
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (creer.isPending) return
		// Chapitres dans l'ordre du manuscrit, quel que soit l'ordre des clics.
		const selection = (chapitres.data ?? []).map((c) => c['@id']).filter((iri) => choisis.includes(iri))
		creer.mutate({
			format,
			options: {
				...(tous ? {} : { chapitres: selection }),
				...(auteur.trim() ? { auteur: auteur.trim() } : {}),
			},
		})
	}

	const aucunChapitre = !tous && choisis.length === 0

	return (
		<form className="workspace-panel projet-form exports-formulaire" onSubmit={handleSubmit}>
			<div className="workspace-panel-heading"><div><span className="book-kicker">NOUVEL EXPORT</span><h2>Exporter le manuscrit</h2></div></div>

			<fieldset className="exports-formats">
				<legend>Format</legend>
				{formats.map((f) => (
					<label key={f.valeur} className={format === f.valeur ? 'actif' : ''}>
						<input type="radio" name="format" value={f.valeur} checked={format === f.valeur} onChange={() => setFormat(f.valeur)} />
						<span><strong>{f.libelle}</strong><small>{f.detail}</small></span>
					</label>
				))}
			</fieldset>

			<fieldset className="exports-chapitres">
				<legend>Chapitres</legend>
				<label><input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} /> Tout le manuscrit</label>
				{!tous && (chapitres.data?.length
					? chapitres.data.map((c, i) => <label key={c['@id']}><input type="checkbox" checked={choisis.includes(c['@id'])} onChange={() => basculer(c['@id'])} /> {i + 1}. {c.titre}</label>)
					: <p className="empty-state">Aucun chapitre dans ce projet.</p>)}
			</fieldset>

			<label>
				Nom d’auteur sur la page de titre
				<input value={auteur} maxLength={255} onChange={(e) => setAuteur(e.target.value)} placeholder={utilisateur.data?.nomAffichage ?? 'Votre nom affiché'} />
			</label>

			{(erreurs.options || erreurs.format) && <p className="projet-form-error">{erreurs.options ?? erreurs.format}</p>}
			{creer.isError && !Object.keys(erreurs).length && <p className="projet-form-error" role="alert">{getErrorMessage(creer.error)}</p>}
			{creer.isSuccess && <p className="versions-ok" role="status">Export lancé : il apparaîtra comme « Prêt » dans quelques instants.</p>}

			<div className="projet-form-actions">
				<button type="submit" className="primary-button" disabled={creer.isPending || aucunChapitre}>
					{creer.isPending ? <LoaderCircle size={14} className="projet-spinner" /> : <FileText size={14} />} Lancer l’export
				</button>
			</div>
		</form>
	)
}

function LigneExport({ projetIri, titre, exportation }: { projetIri: string; titre: string; exportation: Export }) {
	const telecharger = useTelechargerExport(projetIri)
	const supprimer = useSupprimerExport(projetIri)
	const statut = statuts[exportation.statut ?? 'en_attente'] ?? statuts.en_attente
	const Icone = statut.icone
	const nbChapitres = exportation.options?.chapitres?.length
	const erreur = telecharger.error ?? supprimer.error

	return (
		<li className="exports-ligne">
			<span className="exports-format">{(exportation.format ?? '').toUpperCase()}</span>
			<span className="exports-infos">
				<strong>{exportation.creeLe ? `${formaterDate(exportation.creeLe)} à ${heure.format(new Date(exportation.creeLe))}` : 'Export'}</strong>
				<small>
					{nbChapitres ? `${nbChapitres} chapitre${nbChapitres > 1 ? 's' : ''}` : 'Tout le manuscrit'}
					{exportation.options?.auteur ? ` · ${exportation.options.auteur}` : ''}
					{exportation.statut === 'termine' && exportation.expireLe ? ` · disponible jusqu’au ${formaterDate(exportation.expireLe)}` : ''}
				</small>
				{exportation.statut === 'echoue' && exportation.erreur && <small className="exports-erreur">{exportation.erreur}</small>}
				{erreur && <small className="exports-erreur" role="alert">{getErrorMessage(erreur)}</small>}
			</span>
			<span className={`exports-statut ${statut.classe}`}>
				<Icone size={13} className={exportation.statut === 'en_cours' ? 'projet-spinner' : undefined} /> {exportation.statut === 'termine' && !exportation.lienTelechargement ? 'Expiré' : statut.libelle}
			</span>
			<span className="plan-actions">
				{exportation.lienTelechargement && (
					<button type="button" className="secondary-button exports-telecharger" disabled={telecharger.isPending} onClick={() => telecharger.mutate({ lien: exportation.lienTelechargement!, nomFichier: nomFichier(titre, exportation) })}>
						{telecharger.isPending ? <LoaderCircle size={13} className="projet-spinner" /> : <Download size={13} />} Télécharger
					</button>
				)}
				<button type="button" className="icon-button" aria-label="Supprimer cet export" disabled={supprimer.isPending} onClick={() => supprimer.mutate(exportation['@id'])}><Trash2 size={13} /></button>
			</span>
		</li>
	)
}

export default ExportsPage
