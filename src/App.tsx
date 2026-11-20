import { useEffect, useState, type ChangeEvent } from 'react'
import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	Bell,
	BookOpen,
	CalendarDays,
	Check,
	ChevronDown,
	ChevronRight,
	CircleHelp,
	Clock3,
	Command,
	Compass,
	FileText,
	Flame,
	FolderOpen,
	Globe2,
	MapPin,
	LayoutDashboard,
	Lightbulb,
	LogOut,
	MoreHorizontal,
	PenLine,
	Plus,
	Search,
	Save,
	SlidersHorizontal,
	Settings2,
	Sparkles,
	Target,
	Users,
	UserRound,
	WandSparkles,
	X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, toast } from '@/components/ui/toast'
import { AuthPage } from '@/components/AuthPage'
import { clearStoredJwt, getStoredJwt } from '@/lib/auth'
import './App.css'

type NavItem = { label: string; icon: typeof LayoutDashboard; count?: string }

const navigation: { heading: string; items: NavItem[] }[] = [
	{
		heading: 'ESPACE AUTEUR',
		items: [
			{ label: 'Vue d’ensemble', icon: LayoutDashboard },
			{ label: 'Mes projets', icon: FolderOpen, count: '2' },
			{ label: 'Manuscrit', icon: FileText },
		],
	},
	{
		heading: 'CONSTRUIRE',
		items: [
			{ label: 'Mon univers', icon: Globe2 },
			{ label: 'Personnages', icon: Users },
			{ label: 'Plan du roman', icon: Compass },
		],
	},
]

const chapters = [
	{ number: '01', title: 'La maison des marées', words: '2 840 mots', done: true },
	{ number: '02', title: 'Ce que la mer emporte', words: '1 620 mots', done: true },
	{ number: '03', title: 'Les noms oubliés', words: 'En cours', done: false },
]

const weekDays = [
	{ day: 'L', value: 420 },
	{ day: 'M', value: 680 },
	{ day: 'M', value: 310 },
	{ day: 'J', value: 860 },
	{ day: 'V', value: 540 },
	{ day: 'S', value: 220 },
	{ day: 'D', value: 0 },
]

const characterData = [
	{ name: 'Élise Moreau', role: 'Protagoniste', detail: 'Cartographe · 28 ans', color: 'sage' },
	{ name: 'Soren Vahl', role: 'Allié', detail: 'Gardien du phare · 34 ans', color: 'blue' },
	{ name: 'Maëlle', role: 'Personnage secondaire', detail: 'Pêcheuse · âge inconnu', color: 'rose' },
]

const searchableItems = [
	{ title: 'Les marées de verre', type: 'Projet', page: 'Mes projets' },
	{ title: 'Élise Moreau', type: 'Personnage', page: 'Personnages' },
	{ title: 'Soren Vahl', type: 'Personnage', page: 'Personnages' },
	{ title: 'Le phare des Aiguilles', type: 'Lieu', page: 'Mon univers' },
	{ title: 'La maison des marées', type: 'Chapitre', page: 'Plan du roman' },
	{ title: 'Les noms oubliés', type: 'Chapitre', page: 'Manuscrit' },
]

function WorkspacePage({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
	const [query, setQuery] = useState('')
	const [draft, setDraft] = useState('La brume avait recouvert le port avant même le lever du soleil. Élise connaissait ce silence : celui qui précédait les grandes marées.')
	const [saved, setSaved] = useState(true)
	const [selectedChapter, setSelectedChapter] = useState('Les noms oubliés')
	const [showProjectForm, setShowProjectForm] = useState(false)
	const [newProject, setNewProject] = useState('')
	const [projects, setProjects] = useState(['Les marées de verre', 'Le jardin des heures'])
	const [extraChapter, setExtraChapter] = useState(false)
	const [message, setMessage] = useState('')
	const filteredCharacters = characterData.filter((character) => `${character.name} ${character.role} ${character.detail}`.toLowerCase().includes(query.toLowerCase()))
	const filteredSearch = searchableItems.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase()))
	const planActs: { title: string; chapters: typeof chapters }[] = [
		{ title: 'ACTE I · LE DÉCLENCHEUR', chapters: chapters.slice(0, 2) },
		{ title: 'ACTE II · LE POINT DE RUPTURE', chapters: chapters.slice(2) },
		{ title: 'ACTE III · LE DÉNOUEMENT', chapters: extraChapter ? [{ number: '04', title: 'Le jardin englouti', words: 'À écrire', done: false }] : [] },
	]

	const pageDescription: Record<string, string> = {
		'Mes projets': 'Retrouvez vos histoires et reprenez le fil de chacune.',
		Manuscrit: 'Écrivez votre histoire, un passage après l’autre.',
		'Mon univers': 'Les lieux, les objets et les repères qui donnent vie à votre roman.',
		Personnages: 'Faites connaissance avec celles et ceux qui peuplent votre histoire.',
		'Plan du roman': 'Structurez votre récit et gardez le cap de votre intrigue.',
		Paramètres: 'Personnalisez votre espace d’écriture.',
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
				{page === 'Mes projets' && <button className="primary-button" type="button" onClick={() => setShowProjectForm(!showProjectForm)}><Plus size={16} /> Nouveau projet</button>}
				{page === 'Manuscrit' && <button className="primary-button" type="button" onClick={() => { setSaved(true); setMessage('Brouillon enregistré sur cet appareil.') }}><Save size={15} /> Enregistrer</button>}
				{page === 'Plan du roman' && <button className="primary-button" type="button" onClick={() => setExtraChapter(true)}><Plus size={16} /> Ajouter un chapitre</button>}
			</div>

			{message && <div className="workspace-message" role="status"><Check size={15} />{message}<button type="button" aria-label="Fermer le message" onClick={() => setMessage('')}><X size={14} /></button></div>}

			{page === 'Mes projets' && <div className="workspace-panel project-list-panel">
				<div className="workspace-panel-heading"><div><span className="book-kicker">VOTRE BIBLIOTHÈQUE</span><h2>{projects.length} projets</h2></div><span className="project-filter-label"><SlidersHorizontal size={14} /> Tous les projets</span></div>
				{showProjectForm && <form className="new-project-form" onSubmit={(event) => { event.preventDefault(); if (!newProject.trim()) return; setProjects([newProject.trim(), ...projects]); setNewProject(''); setShowProjectForm(false); setMessage('Projet ajouté à votre bibliothèque.') }}><input aria-label="Nom du projet" placeholder="Donnez un nom à votre projet" value={newProject} onChange={(event) => setNewProject(event.target.value)} autoFocus /><button className="primary-button" type="submit"><Plus size={15} /> Créer</button></form>}
				<div className="project-list">{projects.map((title, index) => <button className="project-list-row" type="button" key={title} onClick={() => onNavigate('Manuscrit')}><span className={`project-list-cover cover-tone-${index % 2}`}>{index === 0 ? 'M&' : 'JH'}</span><span className="project-list-copy"><strong>{title}</strong><small>{index === 0 ? 'Roman fantastique · 12 480 mots · 8 chapitres' : 'Roman en préparation · Projet récent'}</small></span><span className="project-list-date"><span className="status-dot" />{index === 0 ? 'Modifié il y a 2 h' : 'Modifié hier'}</span><ArrowRight size={16} /></button>)}</div>
			</div>}

			{page === 'Manuscrit' && <div className="workspace-panel writing-workspace">
				<aside className="writing-outline"><div className="workspace-panel-heading"><div><span className="book-kicker">LES MARÉES DE VERRE</span><h2>Chapitres</h2></div><MoreHorizontal size={18} /></div>{[...chapters, ...(extraChapter ? [{ number: '04', title: 'Le jardin englouti', words: 'À écrire', done: false }] : [])].map((chapter) => <button className={`outline-chapter ${selectedChapter === chapter.title ? 'selected' : ''}`} key={chapter.number} type="button" onClick={() => { setSelectedChapter(chapter.title); setSaved(true) }}><span>{chapter.number}</span>{chapter.title}<small>{chapter.words}</small></button>)}</aside>
				<div className="writing-editor"><div className="editor-toolbar"><span><PenLine size={14} /> {selectedChapter}</span><span className={saved ? 'saved-state' : 'unsaved-state'}><i />{saved ? 'Enregistré' : 'Modifications non enregistrées'}</span></div><textarea aria-label="Texte du manuscrit" value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); setMessage('') }} /><div className="editor-footer"><span>{draft.trim().split(/\s+/).filter(Boolean).length} mots dans ce passage</span><button type="button" onClick={() => { setSaved(true); setMessage('Brouillon enregistré sur cet appareil.') }}><Save size={14} /> Enregistrer le brouillon</button></div></div>
			</div>}

			{page === 'Mon univers' && <>
				<div className="universe-stats"><div className="workspace-panel universe-stat"><span className="section-icon ink-icon"><Users size={16} /></span><strong>12</strong><small>Personnages</small><button type="button" onClick={() => onNavigate('Personnages')}>Explorer <ArrowRight size={13} /></button></div><div className="workspace-panel universe-stat"><span className="section-icon plan-icon"><MapPin size={16} /></span><strong>8</strong><small>Lieux</small><button type="button" onClick={() => setMessage('La collection des lieux est à jour.')}>Explorer <ArrowRight size={13} /></button></div><div className="workspace-panel universe-stat"><span className="section-icon goal-icon"><CalendarDays size={16} /></span><strong>14</strong><small>Repères chronologiques</small><button type="button" onClick={() => setMessage('La chronologie de votre roman est à jour.')}>Explorer <ArrowRight size={13} /></button></div></div>
				<div className="workspace-panel universe-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">LES MARÉES DE VERRE</span><h2>Éléments récemment consultés</h2></div><button className="text-action" type="button" onClick={() => onNavigate('Personnages')}>Voir les personnages <ArrowRight size={14} /></button></div><div className="universe-entry-list"><button type="button" onClick={() => onNavigate('Personnages')}><span className="universe-entry-icon character-entry"><Users size={17} /></span><span><strong>Élise Moreau</strong><small>Personnage · Protagoniste</small></span><ChevronRight size={15} /></button><button type="button" onClick={() => setMessage('Fiche du phare des Aiguilles sélectionnée.')}><span className="universe-entry-icon place-entry"><MapPin size={17} /></span><span><strong>Le phare des Aiguilles</strong><small>Lieu · Côte nord</small></span><ChevronRight size={15} /></button><button type="button" onClick={() => setMessage('Repère chronologique sélectionné.')}><span className="universe-entry-icon time-entry"><CalendarDays size={17} /></span><span><strong>La grande marée</strong><small>Événement · 17e jour d’automne</small></span><ChevronRight size={15} /></button></div></div>
			</>}

			{page === 'Personnages' && <div className="workspace-panel character-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">LES MARÉES DE VERRE</span><h2>Personnages principaux</h2></div><label className="inline-search"><Search size={14} /><input aria-label="Filtrer les personnages" placeholder="Filtrer" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div><div className="character-grid">{filteredCharacters.map((character, index) => <article className="character-card" key={character.name}><div className={`character-avatar ${character.color}`}>{character.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><span className="book-kicker">{character.role.toUpperCase()}</span><h3>{character.name}</h3><p>{character.detail}</p><div className="character-card-footer"><span><FileText size={13} /> Présent dans {index === 0 ? '6' : '3'} chapitres</span><button type="button" aria-label={`Ouvrir la fiche de ${character.name}`} onClick={() => setMessage(`Fiche de ${character.name} sélectionnée.`)}><ArrowRight size={15} /></button></div></article>)}{filteredCharacters.length === 0 && <p className="empty-state">Aucun personnage ne correspond à cette recherche.</p>}</div></div>}

			{page === 'Plan du roman' && <div className="workspace-panel outline-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">STRUCTURE EN 3 ACTES</span><h2>Les marées de verre</h2></div><span className="plan-progress-label">8 chapitres · 30 % du manuscrit</span></div>{planActs.map((act) => <section className="act-section" key={act.title}><h3>{act.title}</h3>{act.chapters.map((chapter) => <button className={`outline-plan-row ${selectedChapter === chapter.title ? 'selected' : ''}`} type="button" key={chapter.number} onClick={() => setSelectedChapter(chapter.title)}><span className="plan-row-number">{chapter.number}</span><span>{chapter.title}</span><small>{chapter.words}</small><ChevronRight size={15} /></button>)}{act.title.includes('ACTE III') && !extraChapter && <p className="empty-act">Votre dénouement prendra forme ici.</p>}</section>)}</div>}

			{page === 'Paramètres' && <div className="workspace-panel settings-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">PRÉFÉRENCES</span><h2>Votre espace d’écriture</h2></div></div><label className="setting-row"><span><strong>Sauvegarde automatique</strong><small>Enregistrer les modifications pendant l’écriture</small></span><input type="checkbox" defaultChecked /></label><label className="setting-row"><span><strong>Rappels d’écriture</strong><small>Recevoir un rappel les jours où vous écrivez</small></span><input type="checkbox" /></label><label className="setting-row"><span><strong>Alertes de cohérence</strong><small>Afficher les incohérences détectées dans le manuscrit</small></span><input type="checkbox" defaultChecked /></label><label className="setting-row"><span><strong>Objectif hebdomadaire</strong><small>Nombre de mots visé chaque semaine</small></span><select defaultValue="5000"><option value="3000">3 000 mots</option><option value="5000">5 000 mots</option><option value="7500">7 500 mots</option></select></label></div>}

			{page === 'Mon profil' && <div className="workspace-panel profile-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">COMPTE AUTEUR</span><h2>Informations personnelles</h2></div></div><div className="profile-summary"><span className="profile-avatar-large">NF</span><span><strong>Nathan F.</strong><small>Auteur depuis octobre 2025</small></span><button type="button" onClick={() => setMessage('Le changement de photo sera disponible prochainement.')}><UserRound size={14} /> Modifier la photo</button></div><label className="profile-field">Nom affiché<input defaultValue="Nathan F." /></label><label className="profile-field">Adresse e-mail<input type="email" defaultValue="nathan@example.com" /></label><label className="profile-field">Formule actuelle<input value="Gratuit" readOnly /></label><button className="primary-button profile-save" type="button" onClick={() => setMessage('Vos informations ont été enregistrées sur cet appareil.')}><Save size={15} /> Enregistrer les modifications</button></div>}

			{page === 'Recherche' && <div className="workspace-panel search-panel"><label className="large-search"><Search size={19} /><input autoFocus placeholder="Un personnage, un lieu, un chapitre…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="workspace-panel-heading"><div><span className="book-kicker">DANS VOTRE ESPACE</span><h2>{query ? `${filteredSearch.length} résultat${filteredSearch.length > 1 ? 's' : ''}` : 'Suggestions récentes'}</h2></div></div><div className="search-results">{filteredSearch.map((item) => <button type="button" key={item.title} onClick={() => onNavigate(item.page)}><span className="search-result-icon"><Search size={14} /></span><span><strong>{item.title}</strong><small>{item.type}</small></span><ArrowUpRight size={15} /></button>)}{filteredSearch.length === 0 && <p className="empty-state">Aucun résultat. Essayez un autre terme.</p>}</div></div>}

			{page === 'Aide' && <div className="workspace-panel help-panel"><div className="workspace-panel-heading"><div><span className="book-kicker">CENTRE D’AIDE</span><h2>Comment pouvons-nous vous aider ?</h2></div></div><label className="large-search"><Search size={17} /><input placeholder="Rechercher dans l’aide" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="faq-list">{[
				['Comment organiser mon roman ?', 'Utilisez le Plan du roman pour répartir votre histoire en actes, chapitres et scènes. Vous pouvez déplacer vos idées au fil de l’écriture.'],
				['Mes textes sont-ils sauvegardés automatiquement ?', 'Votre brouillon est conservé pendant votre session. Pensez à enregistrer vos modifications avant de quitter l’éditeur.'],
				['Que fait la relecture IA ?', 'Elle signale des incohérences possibles de chronologie, de personnages ou de faits. Elle ne réécrit jamais votre texte.'],
				['Puis-je travailler hors ligne ?', 'Le mode hors ligne et la synchronisation sont prévus pour garder votre manuscrit accessible sans connexion.'],
			].filter(([question]) => question.toLowerCase().includes(query.toLowerCase())).map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={15} /></summary><p>{answer}</p></details>)}</div></div>}
		</section>
	)
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredJwt() !== null)
	const [activeNav, setActiveNav] = useState('Vue d’ensemble')
	const [noticeDismissed, setNoticeDismissed] = useState(false)
	const [goal, setGoal] = useState(5000)
	const [showGoalMenu, setShowGoalMenu] = useState(false)
	const [showAllAlerts, setShowAllAlerts] = useState(false)
	const [showQuickStart, setShowQuickStart] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setIsLoading(false)
		}, 900)

		return () => window.clearTimeout(timer)
	}, [])

	const progress = Math.round((3030 / goal) * 100)
	const alerts = showAllAlerts
		? [
				{ tone: 'amber', title: 'Un personnage à deux endroits', detail: 'Élise · Chapitres 2 et 4', icon: Users },
				{ tone: 'rose', title: 'Une date à vérifier', detail: 'La tempête · Chronologie', icon: Clock3 },
				{ tone: 'blue', title: 'Un lieu sans description', detail: 'Le phare des Aiguilles · Univers', icon: Globe2 },
			]
		: [
				{ tone: 'amber', title: 'Un personnage à deux endroits', detail: 'Élise · Chapitres 2 et 4', icon: Users },
				{ tone: 'rose', title: 'Une date à vérifier', detail: 'La tempête · Chronologie', icon: Clock3 },
			]

	const handleSave = () => {
		toast.add({
			title: 'Brouillon enregistré',
			description: 'Votre dernière version est bien sauvegardée.',
			type: 'success',
		})
	}

	if (!isAuthenticated) {
		return <AuthPage onAuthenticated={() => setIsAuthenticated(true)} />
	}

	if (isLoading) {
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

				<button className="project-switcher" type="button" onClick={() => setActiveNav('Mes projets')}>
					<span className="project-cover">M<span>&</span></span>
					<span className="project-switcher-copy"><strong>Les marées de verre</strong><small>Mon roman</small></span>
					<ChevronDown size={15} />
				</button>

				<nav className="side-nav" aria-label="Navigation principale">
					{navigation.map((group) => (
						<div className="nav-group" key={group.heading}>
							<p className="nav-heading">{group.heading}</p>
							{group.items.map(({ label, icon: Icon, count }) => (
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
							))}
						</div>
					))}
				</nav>

				<div className="sidebar-bottom">
					<div className="sidebar-mini-card">
						<span className="mini-card-icon"><Sparkles size={15} /></span>
						<div><strong>Votre univers prend forme</strong><span>12 éléments ajoutés</span></div>
						<ArrowUpRight size={14} />
					</div>
					<button className="nav-link utility-link" type="button" onClick={() => setActiveNav('Paramètres')}>
						<Settings2 size={17} strokeWidth={1.8} /><span>Paramètres</span>
					</button>
					<button className="profile-button" type="button" onClick={() => setActiveNav('Mon profil')}>
						<span className="avatar">NF</span>
						<span className="profile-copy"><strong>Nathan F.</strong><small>Offre gratuite</small></span>
						<MoreHorizontal size={18} />
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
						<button className="icon-button notification-button" type="button" aria-label="Notifications" onClick={() => setNoticeDismissed(false)}>
							<Bell size={17} /><i />
						</button>
						<button className="icon-button" type="button" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => { clearStoredJwt(); setIsAuthenticated(false) }}>
							<LogOut size={16} />
						</button>
						<span className="topbar-divider" />
						<span className="today-label">Mardi 14 octobre 2025</span>
					</div>
				</header>

				<div className="dashboard-content">
					{activeNav === 'Vue d’ensemble' ? (
						<>
							<section className="welcome-row">
								<div>
									<p className="eyebrow"><span className="eyebrow-dot" /> VOTRE ATELIER D’ÉCRITURE</p>
									<h1>Bonjour Nathan <span className="wave">✳</span></h1>
									<p className="welcome-subtitle">Une nouvelle page vous attend. Où en êtes-vous aujourd’hui ?</p>
								</div>
								<Button className="primary-button" type="button" onClick={() => setShowQuickStart(true)}>
									<Plus size={17} /> Nouvelle session
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
											<div className="manuscript-cover" aria-label="Couverture du roman Les marées de verre">
												<span className="cover-kicker">UN ROMAN DE NATHAN F.</span>
												<span className="cover-art"><span /><i /><b /></span>
												<span className="cover-title">Les marées<br />de verre</span>
												<span className="cover-author">NATHAN F.</span>
											</div>
											<div className="manuscript-info">
												<div className="book-title-row"><div><span className="book-kicker">PROJET EN COURS</span><h2>Les marées de verre</h2></div><button className="icon-button more-button" aria-label="Plus d’options" type="button"><MoreHorizontal size={19} /></button></div>
												<div className="book-meta"><Badge variant="secondary">Roman fantastique</Badge><span>·</span> Mis à jour il y a 2 h</div>
												<div className="writing-stats">
													<div><span className="stat-number">12 480</span><span className="stat-caption">mots écrits</span></div>
													<span className="stat-separator" />
													<div><span className="stat-number">8</span><span className="stat-caption">chapitres</span></div>
													<span className="stat-separator" />
													<div><span className="stat-number">~ 42 k</span><span className="stat-caption">objectif final</span></div>
												</div>
												<div className="chapter-progress-row"><span>Progression du manuscrit</span><strong>30 %</strong></div>
												<div className="progress-track"><span style={{ width: '30%' }} /></div>
												<Button className="resume-button" type="button" onClick={() => { setActiveNav('Manuscrit'); handleSave() }}><BookOpen size={16} /> Reprendre l’écriture <span>Dernière page : chapitre 8, p. 3</span><ArrowRight size={15} /></Button>
											</div>
										</div>
									</article>

									<article className="chapters-panel">
										<div className="panel-heading-row">
											<div><div className="section-label"><span className="section-icon plan-icon"><Compass size={15} /></span> LE PLAN DU ROMAN</div><h2>Votre histoire, en un coup d’œil</h2></div>
											<button className="text-action" type="button" onClick={() => setActiveNav('Plan du roman')}>Voir le plan <ArrowRight size={14} /></button>
										</div>
										<div className="chapter-list">
											{chapters.map((chapter) => (
												<button className={`chapter-row ${chapter.done ? 'chapter-done' : 'chapter-current'}`} key={chapter.number} type="button" onClick={() => setActiveNav('Plan du roman')}>
													<span className="chapter-number">{chapter.done ? <Check size={13} /> : chapter.number}</span>
													<span className="chapter-title">{chapter.title}</span>
													<span className={`chapter-status ${chapter.done ? 'done-status' : ''}`}>{chapter.words}</span>
													<ChevronRight className="chapter-chevron" size={15} />
												</button>
											))}
										</div>
									</article>
								</div>

								<div className="right-column">
									<article className="goal-panel">
										<div className="panel-topline">
											<div className="section-label"><span className="section-icon goal-icon"><Target size={15} /></span> MON RYTHME</div>
											<div className="goal-menu-wrap">
												<button className="period-button" type="button" aria-expanded={showGoalMenu} onClick={() => setShowGoalMenu(!showGoalMenu)}>Cette semaine <ChevronDown size={13} /></button>
												{showGoalMenu && <div className="goal-menu">{[3000, 5000, 7500].map((amount) => <button type="button" key={amount} onClick={() => { setGoal(amount); setShowGoalMenu(false) }}>{amount.toLocaleString('fr-FR')} mots {goal === amount && <Check size={13} />}</button>)}</div>}
											</div>
										</div>
										<div className="goal-numbers"><strong>3 030</strong><span> / {goal.toLocaleString('fr-FR')} mots</span></div>
										<div className="goal-track"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div>
										<div className="goal-foot"><span>{progress >= 100 ? 'Objectif atteint !' : `Encore ${Math.max(goal - 3030, 0).toLocaleString('fr-FR')} mots pour atteindre votre objectif`}</span><strong>{progress}%</strong></div>
										<div className="week-chart" aria-label="Mots écrits chaque jour cette semaine">
											{weekDays.map((item, index) => <div className="day-column" key={`${item.day}-${index}`}><div className="bar-track"><span className={index === 3 ? 'bar-current' : ''} style={{ height: `${Math.max((item.value / 900) * 100, item.value ? 10 : 3)}%` }} /></div><span className={index === 3 ? 'current-day' : ''}>{item.day}</span></div>)}
										</div>
									</article>

									<article className="streak-strip"><span className="streak-icon"><Flame size={18} fill="currentColor" /></span><span><strong>4 jours</strong><small>de régularité cette semaine</small></span><div className="streak-dots"><i /><i /><i /><i className="today-streak" /><i /><i /><i /></div></article>

									<article className="alerts-panel">
										<div className="alerts-heading"><div><div className="section-label"><span className="section-icon alert-icon"><WandSparkles size={15} /></span> RELECTURE IA</div><h2>À garder à l’œil <span className="alert-count">2</span></h2></div><button className="icon-button help-button" aria-label="À propos de la relecture IA" type="button" title="La relecture signale des incohérences sans réécrire votre texte"><CircleHelp size={16} /></button></div>
										<p className="alerts-intro">Quelques détails à vérifier dans votre histoire.</p>
										<div className="alert-list">
											{alerts.map(({ tone, title, detail, icon: Icon }) => <button className="alert-row" type="button" key={title} onClick={() => setActiveNav('Manuscrit')}><span className={`alert-symbol ${tone}`}><Icon size={15} /></span><span className="alert-copy"><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={15} /></button>)}
										</div>
										<button className="all-alerts-button" type="button" onClick={() => setShowAllAlerts(!showAllAlerts)}>{showAllAlerts ? 'Réduire' : 'Voir les 2 alertes'} <ArrowRight size={14} /></button>
									</article>
								</div>
							</section>

							<footer className="dashboard-footer"><span>Votre espace d’écriture, à votre rythme.</span><span><span className="sync-dot" /> Tout est enregistré <span className="footer-separator">·</span> <button type="button" onClick={() => setActiveNav('Aide')}>Besoin d’aide ?</button></span></footer>
						</>
					) : (
						<WorkspacePage page={activeNav} onNavigate={setActiveNav} />
					)}
				</div>
			</main>

			{showQuickStart && <div className="modal-backdrop" role="presentation" onClick={() => setShowQuickStart(false)}><section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-modal-title" onClick={(event) => event.stopPropagation()}><button className="icon-button modal-close" type="button" aria-label="Fermer" onClick={() => setShowQuickStart(false)}><X size={18} /></button><span className="modal-sparkle"><Sparkles size={19} /></span><p className="eyebrow">UNE PETITE SESSION, UN GRAND PAS</p><h2 id="quick-modal-title">On reprend le fil ?</h2><p className="modal-description">Votre dernière session s’est arrêtée au chapitre 8. Installez-vous, votre histoire vous attend.</p><div className="modal-session-info"><BookOpen size={17} /><span><strong>Les marées de verre</strong><small>Chapitre 8 · dernière page, p. 3</small></span><ArrowDownRight size={16} /></div><Button className="primary-button modal-start" type="button" onClick={() => { setShowQuickStart(false); setActiveNav('Manuscrit'); handleSave() }}>Commencer à écrire <ArrowRight size={15} /></Button><button className="modal-later" type="button" onClick={() => setShowQuickStart(false)}>Je reviendrai plus tard</button></section></div>}
			<Toaster />
		</div>
	)
}

export default App
