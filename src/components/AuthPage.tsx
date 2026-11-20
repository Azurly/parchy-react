import { useState, type FormEvent } from 'react'
import { ArrowRight, BookOpen, KeyRound, Mail } from 'lucide-react'
import { loginWithPassword } from '@/lib/auth'
import './AuthPage.css'

type AuthPageProps = {
	onAuthenticated: () => void
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			await loginWithPassword(email, password)
			onAuthenticated()
		} catch (loginError) {
			setError(loginError instanceof Error ? loginError.message : 'La connexion a échoué.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="auth-page">
			<section className="auth-panel" aria-labelledby="auth-title">
				<a className="auth-brand" href="/" aria-label="Parchy, accueil">
					<span className="auth-brand-mark"><BookOpen size={19} strokeWidth={2.2} /></span>
					<span>parchy<span>.</span></span>
				</a>

				<div className="auth-form-wrap">
					<p className="auth-eyebrow">VOTRE ATELIER VOUS ATTEND</p>
					<h1 id="auth-title">Ravi de vous revoir.</h1>
					<p className="auth-intro">Connectez-vous pour retrouver vos projets et reprendre le fil de votre histoire.</p>

					<form className="auth-form" onSubmit={handleSubmit}>
						<label htmlFor="auth-email">Adresse e-mail</label>
						<div className="auth-input-wrap">
							<Mail size={17} aria-hidden="true" />
							<input id="auth-email" autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.fr" required />
						</div>

						<label htmlFor="auth-password">Mot de passe</label>
						<div className="auth-input-wrap">
							<KeyRound size={17} aria-hidden="true" />
							<input id="auth-password" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" required />
						</div>

						{error && <p className="auth-error" role="alert">{error}</p>}

						<button className="auth-submit" type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Connexion…' : 'Se connecter'}
							{!isSubmitting && <ArrowRight size={17} />}
						</button>
					</form>

					<p className="auth-footnote">En vous connectant, vous retrouvez votre espace d’écriture personnel.</p>
				</div>

				<footer className="auth-footer"><span>© Parchy</span><span>Un mot après l’autre.</span></footer>
			</section>

			<aside className="auth-story" aria-label="Aperçu de votre espace d’écriture">
				<div className="story-topline"><span><i /> ESPACE AUTEUR</span><span>01 — 03</span></div>
				<div className="story-content">
					<p className="story-kicker">LES MARÉES DE VERRE <span>·</span> CHAPITRE 03</p>
					<p className="story-excerpt">La brume avait recouvert le port avant même le lever du soleil.</p>
					<p className="story-excerpt-secondary">Élise connaissait ce silence : celui qui précédait les grandes marées.</p>
					<div className="story-divider" />
					<div className="story-meta"><span>MANUSCRIT EN COURS</span><strong>12 480 <small>mots</small></strong></div>
					<div className="story-progress"><span /></div>
					<div className="story-progress-caption"><span>Votre histoire reprend ici</span><span>30 %</span></div>
				</div>
				<div className="story-bottom"><span>Écrivez à votre rythme.</span><BookOpen size={17} /></div>
			</aside>
		</main>
	)
}
