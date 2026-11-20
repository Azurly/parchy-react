import { useState, type ChangeEvent } from 'react'
import {
	ArrowRight,
	ArrowUpRight,
	BookOpen,
	Check,
	ChevronDown,
	ChevronRight,
	Command,
	Download,
	Compass,
	FileText,
	FolderOpen,
	Globe2,
	LayoutDashboard,
	ListChecks,
	Lightbulb,
	LogOut,
	MoreHorizontal,
	Search,
	Sparkles,
	TrendingUp,
	Users,
	X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/toast'
import AuthScreen from '@/features/auth/components/auth-screen'
import { useCurrentUser, useLogout, useSessionEndMessage, useSessionToken } from '@/features/auth/hooks'
import { libelleFormule } from '@/features/auth/formule'
import type { Utilisateur } from '@/features/auth/api'
import { getErrorMessage } from '@/shared/api/errors'
import ProjetsPage from '@/features/projets/components/projets-page'
import ProjectSwitcher from '@/features/projets/components/project-switcher'
import { useProjetActif, useProjets } from '@/features/projets/hooks'
import { depuis } from '@/features/projets/libelles'
import ManuscritPage from '@/features/scenes/components/manuscrit-page'
import PlanPage from '@/features/chapitres/components/plan-page'
import { useChapitres } from '@/features/chapitres/hooks'
import { useEtatGlobalSync } from '@/features/scenes/hooks'
import { formaterMots } from '@/features/scenes/libelles'
import RepriseModal from '@/features/scenes/components/reprise-modal'
import UniversPage from '@/features/univers/components/univers-page'
import PersonnagesPage from '@/features/univers/components/personnages-page'
import { useEntites } from '@/features/univers/hooks'
import RythmePanel from '@/features/suivi/components/rythme-panel'
import RecherchePage from '@/features/recherche/components/recherche-page'
import ProfilPage from '@/features/auth/components/profil-page'
import ConceptionPage from '@/features/conception/components/conception-page'
import SuiviPage from '@/features/suivi/components/suivi-page'
import ExportsPage from '@/features/exports/components/exports-page'
import './App.css'

type NavItem = { label: string; icon: typeof LayoutDashboard; count?: string }

const navigation: { heading: string; items: NavItem[] }[] = [
	{
		heading: 'ESPACE AUTEUR',
		items: [
			{ label: 'Vue d’ensemble', icon: LayoutDashboard },
			{ label: 'Mes projets', icon: FolderOpen },
			{ label: 'Manuscrit', icon: FileText },
			{ label: 'Suivi', icon: TrendingUp },
			{ label: 'Exports', icon: Download },
		],
	},
	{
		heading: 'CONSTRUIRE',
		items: [
			{ label: 'Conception guidée', icon: ListChecks },
			{ label: 'Mon univers', icon: Globe2 },
			{ label: 'Personnages', icon: Users },
			{ label: 'Plan du roman', icon: Compass },
		],
	},
]

function WorkspacePage({
	page,
	onNavigate,
	user,
	recherche,
	onRecherche,
}: {
	page: string
	onNavigate: (page: string) => void
	user: Utilisateur
	recherche: string
	onRecherche: (valeur: string) => void
}) {
	const [query, setQuery] = useState('')
	const [message, setMessage] = useState('')
	const pageDescription: Record<string, string> = {
		'Mes projets': 'Retrouvez vos histoires et reprenez le fil de chacune.',
		Manuscrit: 'Écrivez votre histoire, un passage après l’autre.',
		Exports: 'Votre manuscrit en Word ou en livre numérique.',
		Suivi: 'Votre rythme, vos objectifs et vos sessions d’écriture.',
		'Conception guidée': 'Construisez votre roman pas à pas, en suivant une méthode d’écriture.',
		'Mon univers': 'Les lieux, les objets et les repères qui donnent vie à votre roman.',
		Personnages: 'Faites connaissance avec celles et ceux qui peuplent votre histoire.',
		'Plan du roman': 'Structurez votre récit et gardez le cap de votre intrigue.',
		'Mon profil': 'Gérez les informations de votre compte auteur.',
		Recherche: 'Retrouvez rapidement un élément de votre espace.',
		Aide: 'Quelques réponses pour vous accompagner dans votre atelier.',
	}

	return (
		<section className="workspace-page">
			<div className="workspace-heading">
				<div>
					<p className="eyebrow"><span className="eyebrow-dot" /> VOTRE ESPACE D’ÉCRITURE</p>
					<h1>{page}</h1>
					<p className="welcome-subtitle">{pageDescription[page] ?? 'Votre espace Parchy.'}</p>
				</div>
			</div>

			{message && <div className="workspace-message" role="status"><Check size={15} />{message}<button type="button" aria-label="Fermer le message" onClick={() => setMessage('')}><X size={14} /></button></div>}

			{page === 'Mes projets' && <ProjetsPage onOuvrir={() => onNavigate('Manuscrit')} onMessage={setMessage} />}

			{page === 'Manuscrit' && <ManuscritPage onCreerProjet={() => onNavigate('Mes projets')} />}

			{page === 'Exports' && <ExportsPage onCreerProjet={() => onNavigate('Mes projets')} />}

			{page === 'Suivi' && <SuiviPage onCreerProjet={() => onNavigate('Mes projets')} />}

			{page === 'Conception guidée' && <ConceptionPage onCreerProjet={() => onNavigate('Mes projets')} onEcrire={() => onNavigate('Manuscrit')} />}

			{page === 'Mon univers' && <UniversPage onVoirPersonnages={() => onNavigate('Personnages')} onCreerProjet={() => onNavigate('Mes projets')} onMessage={setMessage} />}

			{page === 'Personnages' && <PersonnagesPage onCreerProjet={() => onNavigate('Mes projets')} onMessage={setMessage} />}

			{page === 'Plan du roman' && <PlanPage onOuvrirManuscrit={() => onNavigate('Manuscrit')} onCreerProjet={() => onNavigate('Mes projets')} />}

			{page === 'Mon profil' && <ProfilPage user={user} onMessage={setMessage} />}

			{page === 'Recherche' && <RecherchePage requete={recherche} onRequete={onRecherche} onNavigate={onNavigate} />}

			{page === 'Aide' && <div className="workspace-panel help-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">CENTRE D’AIDE</span><h2>Comment pouvons-nous vous aider ?</h2></div></div><label className="large-search"><Search size={17} /><input placeholder="Rechercher dans l’aide" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="faq-list">{[
				['Comment organiser mon roman ?', 'Utilisez le Plan du roman pour répartir votre histoire en actes, chapitres et scènes. Vous pouvez déplacer vos idées au fil de l’écriture.'],
				['Mes textes sont-ils sauvegardés automatiquement ?', 'Oui. Votre texte est enregistré sur votre appareil pendant que vous écrivez, puis envoyé sur votre compte quelques secondes après votre dernière frappe. L’indicateur en haut de l’éditeur vous dit où en est la sauvegarde.'],
				['Puis-je travailler hors ligne ?', 'Oui, pour une scène déjà ouverte : sans connexion, votre texte reste enregistré sur cet appareil et part automatiquement dès que la connexion revient.'],
			].filter(([question]) => question.toLowerCase().includes(query.toLowerCase())).map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={15} /></summary><p>{answer}</p></details>)}</div></div>}
		</section>
	)
}

function App() {
	const [activeNav, setActiveNav] = useState('Mes projets')
	const [noticeDismissed, setNoticeDismissed] = useState(false)
	const [showQuickStart, setShowQuickStart] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const token = useSessionToken()
	const sessionEndMessage = useSessionEndMessage()
	const currentUser = useCurrentUser()
	const logout = useLogout()
	const user = currentUser.data ?? null
	const projets = useProjets()
	const { projet: projetActif } = useProjetActif()
	const chapitresActifs = useChapitres(projetActif?.['@id'])
	const etatSync = useEtatGlobalSync()
	const entitesActives = useEntites(projetActif?.['@id'])

	const handleLogout = () => {
		logout()
		setActiveNav('Mes projets')
	}

	const titreActif = projetActif?.titre ?? 'Aucun projet'
	const motsEcrits = chapitresActifs.data?.reduce((total, c) => total + (c.nombreMots ?? 0), 0) ?? 0
	const avancement = projetActif?.objectifMots ? Math.min(Math.round((motsEcrits / projetActif.objectifMots) * 100), 100) : null
	const aujourdhui = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

	if (token === null) {
		return <AuthScreen initialError={sessionEndMessage} />
	}

	if (currentUser.isError) {
		return <AuthScreen initialError={getErrorMessage(currentUser.error)} />
	}

	if (!user) {
		return (
			<div className="app-shell" aria-busy="true" aria-live="polite">
				<aside className="sidebar">
					<div className="brand" aria-hidden="true">
						<Skeleton className="h-8 w-8 rounded-xl" />
						<Skeleton className="ml-2 h-6 w-24 rounded-md" />
					</div>

					<Skeleton className="mt-8 h-16 w-full rounded-xl border border-border/60" />

					<div className="side-nav" aria-hidden="true">
						{[1, 2].map((group) => (
							<div key={group} className="nav-group">
								<Skeleton className="mb-3 ml-3 h-3 w-20 rounded-full" />
								{[1, 2, 3].map((row) => (
									<Skeleton
										key={`${group}-${row}`}
										className="mb-2 h-9 w-full rounded-lg"
									/>
								))}
							</div>
						))}
					</div>

					<div className="sidebar-bottom" aria-hidden="true">
						<Skeleton className="mb-4 h-16 w-full rounded-xl" />
						<Skeleton className="mb-3 h-9 w-full rounded-lg" />
						<div className="profile-button" style={{ paddingTop: 12 }}>
							<Skeleton className="h-8 w-8 rounded-full" />
							<div className="profile-copy" style={{ gap: 8, width: '100%' }}>
								<Skeleton className="h-3 w-16 rounded-full" />
								<Skeleton className="h-2.5 w-20 rounded-full" />
							</div>
						</div>
					</div>
				</aside>

				<main className="main-area">
					<header className="topbar" aria-hidden="true">
						<Skeleton className="h-5 w-28 rounded-full" />
						<div className="topbar-actions">
							<Skeleton className="h-8 w-44 rounded-lg" />
							<Skeleton className="h-8 w-8 rounded-lg" />
							<Skeleton className="h-5 w-20 rounded-full" />
						</div>
					</header>

					<div className="dashboard-content">
						<div className="welcome-row" aria-hidden="true">
							<div className="w-full max-w-[420px]">
								<Skeleton className="mb-3 h-3 w-28 rounded-full" />
								<Skeleton className="mb-2 h-10 w-56 rounded-lg" />
								<Skeleton className="h-4 w-72 rounded-full" />
							</div>
							<Skeleton className="h-10 w-36 rounded-lg" />
						</div>

						<Skeleton className="mb-5 h-14 w-full rounded-xl" />

						<div className="dashboard-grid" aria-hidden="true">
							<div className="left-column">
								<Skeleton className="mb-4 h-[300px] w-full rounded-xl" />
								<Skeleton className="h-[220px] w-full rounded-xl" />
							</div>
							<div className="right-column">
								<Skeleton className="mb-4 h-[240px] w-full rounded-xl" />
								<Skeleton className="mb-4 h-16 w-full rounded-xl" />
								<Skeleton className="h-[230px] w-full rounded-xl" />
							</div>
						</div>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<a className="brand" href="#accueil" aria-label="Parchy, accueil">
					<span className="brand-mark"><BookOpen size={19} strokeWidth={2.2} /></span>
					<span className="brand-name">parchy<span>.</span></span>
				</a>

				<ProjectSwitcher onVoirTous={() => setActiveNav('Mes projets')} />

				<nav className="side-nav" aria-label="Navigation principale">
					{navigation.map((group) => (
						<div className="nav-group" key={group.heading}>
							<p className="nav-heading">{group.heading}</p>
							{group.items.map(({ label, icon: Icon, count: itemCount }) => {
								const count = label === 'Mes projets' ? projets.data?.length.toString() : itemCount
								return (
								<button
									className={`nav-link ${activeNav === label ? 'active' : ''}`}
									key={label}
									type="button"
									onClick={() => setActiveNav(label)}
								>
									<Icon size={17} strokeWidth={1.8} />
									<span>{label}</span>
									{count && <span className="nav-count">{count}</span>}
								</button>
								)
							})}
						</div>
					))}
				</nav>

				<div className="sidebar-bottom">
					{projetActif && (
						<button className="sidebar-mini-card" type="button" onClick={() => setActiveNav('Mon univers')}>
							<span className="mini-card-icon"><Sparkles size={15} /></span>
							<div><strong>Votre univers</strong><span>{entitesActives.isPending ? 'Chargement…' : `${entitesActives.data?.length ?? 0} élément${(entitesActives.data?.length ?? 0) > 1 ? 's' : ''}`}</span></div>
							<ArrowUpRight size={14} />
						</button>
					)}
					<button className="profile-button" type="button" onClick={() => setActiveNav('Mon profil')}>
						<span className="avatar">{user.nomAffichage.slice(0, 2).toUpperCase()}</span>
						<span className="profile-copy"><strong>{user.nomAffichage}</strong><small>Formule {libelleFormule(user)}</small></span>
						<MoreHorizontal size={18} />
					</button>
					<button className="nav-link utility-link" type="button" onClick={handleLogout}>
						<LogOut size={17} strokeWidth={1.8} /><span>Se déconnecter</span>
					</button>
				</div>
			</aside>

			<main className="main-area">
				<header className="topbar">
					<div className="breadcrumb"><span>Mon espace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
					<div className="topbar-actions">
						<div className="search-button" role="search">
							<Search size={15} />
							<Input
								aria-label="Rechercher"
								value={searchValue}
								onChange={(event: ChangeEvent<HTMLInputElement>) => {
									setSearchValue(event.target.value)
									if (event.target.value.trim()) {
										setActiveNav('Recherche')
									}
								}}
								placeholder="Rechercher"
								className="border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
							/>
							<kbd><Command size={10} /> K</kbd>
						</div>
						<span className="topbar-divider" />
						<span className="today-label">{aujourdhui.charAt(0).toUpperCase() + aujourdhui.slice(1)}</span>
					</div>
				</header>

				<div className="dashboard-content">
					{activeNav === 'Vue d’ensemble' ? (
						<>
							<section className="welcome-row">
								<div>
									<p className="eyebrow"><span className="eyebrow-dot" /> VOTRE ATELIER D’ÉCRITURE</p>
									<h1>Bonjour {user.nomAffichage.split(' ')[0]} <span className="wave">✳</span></h1>
									<p className="welcome-subtitle">Une nouvelle page vous attend. Où en êtes-vous aujourd’hui ?</p>
								</div>
								<Button className="primary-button" type="button" onClick={() => setShowQuickStart(true)}>
									<BookOpen size={17} /> Reprendre l’écriture
								</Button>
							</section>

							{!noticeDismissed && (
								<section className="notice-banner" aria-label="Conseil d’écriture">
									<div className="notice-icon"><Lightbulb size={18} /></div>
									<p><strong>Le saviez-vous ?</strong> Les petites sessions régulières font les grands romans. 15 minutes suffisent pour garder le fil.</p>
									<button type="button" className="notice-dismiss" aria-label="Fermer le conseil" onClick={() => setNoticeDismissed(true)}><X size={16} /></button>
								</section>
							)}

							<section className="dashboard-grid">
								<div className="left-column">
									<article className="manuscript-panel">
										<div className="panel-topline">
											<div className="section-label"><span className="section-icon ink-icon"><FileText size={15} /></span> VOTRE MANUSCRIT</div>
											<button className="text-action" type="button" onClick={() => setActiveNav('Manuscrit')}>Ouvrir le manuscrit <ArrowRight size={14} /></button>
										</div>
										<div className="manuscript-body">
											<div className="manuscript-cover" aria-label={`Couverture du roman ${titreActif}`}>
												<span className="cover-kicker">UN ROMAN DE {user.nomAffichage.toUpperCase()}</span>
												<span className="cover-art"><span /><i /><b /></span>
												<span className="cover-title">{titreActif}</span>
												<span className="cover-author">{user.nomAffichage.toUpperCase()}</span>
											</div>
											<div className="manuscript-info">
												<div className="book-title-row"><div><span className="book-kicker">PROJET EN COURS</span><h2>{titreActif}</h2></div></div>
												<div className="book-meta">{projetActif?.genre && <><Badge variant="secondary">{projetActif.genre}</Badge><span>·</span></>} {projetActif ? `Mis à jour ${depuis(projetActif.misAJourLe)}` : 'Créez un projet pour commencer'}</div>
												<div className="writing-stats">
													<div><span className="stat-number">{motsEcrits.toLocaleString('fr-FR')}</span><span className="stat-caption">mots écrits</span></div>
													<span className="stat-separator" />
													<div><span className="stat-number">{chapitresActifs.data?.length ?? 0}</span><span className="stat-caption">chapitres</span></div>
													<span className="stat-separator" />
													<div><span className="stat-number">{projetActif?.objectifMots ? `~ ${Math.round(projetActif.objectifMots / 1000)} k` : '—'}</span><span className="stat-caption">objectif final</span></div>
												</div>
												<div className="chapter-progress-row"><span>Progression du manuscrit</span><strong>{avancement === null ? '—' : `${avancement} %`}</strong></div>
												<div className="progress-track"><span style={{ width: `${avancement ?? 0}%` }} /></div>
												<Button className="resume-button" type="button" onClick={() => setActiveNav('Manuscrit')}><BookOpen size={16} /> Reprendre l’écriture <span>{avancement === null ? 'Fixez un objectif de mots dans votre projet' : `${formaterMots(motsEcrits)} sur ${formaterMots(projetActif?.objectifMots ?? 0)}`}</span><ArrowRight size={15} /></Button>
											</div>
										</div>
									</article>

									<article className="chapters-panel">
										<div className="panel-heading-row">
											<div><div className="section-label"><span className="section-icon plan-icon"><Compass size={15} /></span> LE PLAN DU ROMAN</div><h2>Votre histoire, en un coup d’œil</h2></div>
											<button className="text-action" type="button" onClick={() => setActiveNav('Plan du roman')}>Voir le plan <ArrowRight size={14} /></button>
										</div>
										<div className="chapter-list">
											{chapitresActifs.data?.length === 0 && <p className="empty-state">Aucun chapitre pour l’instant.</p>}
											{chapitresActifs.data?.slice(0, 5).map((chapitre, index) => (
												<button className={`chapter-row ${(chapitre.nombreMots ?? 0) > 0 ? 'chapter-done' : 'chapter-current'}`} key={chapitre['@id']} type="button" onClick={() => setActiveNav('Plan du roman')}>
													<span className="chapter-number">{String(index + 1).padStart(2, '0')}</span>
													<span className="chapter-title">{chapitre.titre}</span>
													<span className="chapter-status">{(chapitre.nombreMots ?? 0) > 0 ? formaterMots(chapitre.nombreMots) : 'À écrire'}</span>
													<ChevronRight className="chapter-chevron" size={15} />
												</button>
											))}
										</div>
									</article>
								</div>

								<div className="right-column">
									<RythmePanel projet={projetActif} motsEcrits={motsEcrits} />
								</div>
							</section>

							<footer className="dashboard-footer"><span>Votre espace d’écriture, à votre rythme.</span><span><span className="sync-dot" /> {etatSync === 'synchronise' ? 'Tout est enregistré' : etatSync === 'hors_ligne' ? 'Hors ligne · enregistré sur cet appareil' : etatSync === 'conflit' || etatSync === 'erreur' ? 'Une scène demande votre attention' : 'Enregistrement en cours…'} <span className="footer-separator">·</span> <button type="button" onClick={() => setActiveNav('Aide')}>Besoin d’aide ?</button></span></footer>
						</>
					) : (
						<WorkspacePage
							page={activeNav}
							onNavigate={setActiveNav}
							user={user}
							recherche={searchValue}
							onRecherche={setSearchValue}
						/>
					)}
				</div>
			</main>

			{showQuickStart && <RepriseModal onClose={() => setShowQuickStart(false)} onOuvrir={setActiveNav} />}
			<Toaster />
		</div>
	)
}

export default App
