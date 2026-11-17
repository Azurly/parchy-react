import { useState } from 'react'
import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	Bell,
	BookOpen,
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
	LayoutDashboard,
	Lightbulb,
	MoreHorizontal,
	Plus,
	Search,
	Settings2,
	Sparkles,
	Target,
	Users,
	WandSparkles,
	X,
} from 'lucide-react'
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

function App() {
	const [activeNav, setActiveNav] = useState('Vue d’ensemble')
	const [noticeDismissed, setNoticeDismissed] = useState(false)
	const [goal, setGoal] = useState(5000)
	const [showGoalMenu, setShowGoalMenu] = useState(false)
	const [showAllAlerts, setShowAllAlerts] = useState(false)
	const [showQuickStart, setShowQuickStart] = useState(false)

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
						<button className="search-button" type="button" onClick={() => setActiveNav('Recherche')}>
							<Search size={15} /><span>Rechercher</span><kbd><Command size={10} /> K</kbd>
						</button>
						<button className="icon-button notification-button" type="button" aria-label="Notifications" onClick={() => setNoticeDismissed(false)}>
							<Bell size={17} /><i />
						</button>
						<span className="topbar-divider" />
						<span className="today-label">Mardi 14 octobre 2025</span>
					</div>
				</header>

				<div className="dashboard-content">
					<section className="welcome-row">
						<div>
							<p className="eyebrow"><span className="eyebrow-dot" /> VOTRE ATELIER D’ÉCRITURE</p>
							<h1>Bonjour Nathan <span className="wave">✳</span></h1>
							<p className="welcome-subtitle">Une nouvelle page vous attend. Où en êtes-vous aujourd’hui ?</p>
						</div>
						<button className="primary-button" type="button" onClick={() => setShowQuickStart(true)}>
							<Plus size={17} /> Nouvelle session
						</button>
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
										<p className="book-meta">Roman fantastique <span>·</span> Mis à jour il y a 2 h</p>
										<div className="writing-stats">
											<div><span className="stat-number">12 480</span><span className="stat-caption">mots écrits</span></div>
											<span className="stat-separator" />
											<div><span className="stat-number">8</span><span className="stat-caption">chapitres</span></div>
											<span className="stat-separator" />
											<div><span className="stat-number">~ 42 k</span><span className="stat-caption">objectif final</span></div>
										</div>
										<div className="chapter-progress-row"><span>Progression du manuscrit</span><strong>30 %</strong></div>
										<div className="progress-track"><span style={{ width: '30%' }} /></div>
										<button className="resume-button" type="button" onClick={() => setActiveNav('Manuscrit')}><BookOpen size={16} /> Reprendre l’écriture <span>Dernière page : chapitre 8, p. 3</span><ArrowRight size={15} /></button>
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
				</div>
			</main>

			{showQuickStart && <div className="modal-backdrop" role="presentation" onClick={() => setShowQuickStart(false)}><section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-modal-title" onClick={(event) => event.stopPropagation()}><button className="icon-button modal-close" type="button" aria-label="Fermer" onClick={() => setShowQuickStart(false)}><X size={18} /></button><span className="modal-sparkle"><Sparkles size={19} /></span><p className="eyebrow">UNE PETITE SESSION, UN GRAND PAS</p><h2 id="quick-modal-title">On reprend le fil ?</h2><p className="modal-description">Votre dernière session s’est arrêtée au chapitre 8. Installez-vous, votre histoire vous attend.</p><div className="modal-session-info"><BookOpen size={17} /><span><strong>Les marées de verre</strong><small>Chapitre 8 · dernière page, p. 3</small></span><ArrowDownRight size={16} /></div><button className="primary-button modal-start" type="button" onClick={() => { setShowQuickStart(false); setActiveNav('Manuscrit') }}>Commencer à écrire <ArrowRight size={15} /></button><button className="modal-later" type="button" onClick={() => setShowQuickStart(false)}>Je reviendrai plus tard</button></section></div>}
		</div>
	)
}

export default App
