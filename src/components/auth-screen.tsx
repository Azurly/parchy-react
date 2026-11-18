import { useState, type FormEvent } from 'react'
import { BookOpen, LoaderCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
	getApiErrorMessage,
	getCurrentUser,
	login,
	register,
	type Utilisateur,
} from '@/lib/api'
import './auth-screen.css'

interface AuthScreenProps {
	onAuthenticated: (token: string, user: Utilisateur) => Promise<void>
	initialError?: string
}

function AuthScreen({ onAuthenticated, initialError = '' }: AuthScreenProps) {
	const [isRegistering, setIsRegistering] = useState(false)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			if (isRegistering) {
				await register(email.trim(), password, name.trim())
			}
			const token = await login(email.trim(), password)
			const user = await getCurrentUser(token)
			await onAuthenticated(token, user)
		} catch (submitError) {
			setError(getApiErrorMessage(submitError))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="auth-screen">
			<section className="auth-card" aria-labelledby="auth-title">
				<a className="auth-brand" href="#accueil" aria-label="Parchy, accueil">
					<span className="auth-brand-mark"><BookOpen size={20} /></span>
					<span>parchy<span>.</span></span>
				</a>
				<p className="auth-eyebrow">VOTRE ATELIER D’ÉCRITURE</p>
				<h1 id="auth-title">{isRegistering ? 'Créez votre compte' : 'Heureux de vous revoir'}</h1>
				<p className="auth-description">
					{isRegistering
						? 'Inscrivez-vous pour retrouver votre espace auteur.'
						: 'Connectez-vous pour retrouver vos projets et votre espace auteur.'}
				</p>

				<form className="auth-form" onSubmit={handleSubmit}>
					{isRegistering && (
						<label>
							Nom affiché
							<Input
								autoComplete="name"
								required
								maxLength={100}
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Votre nom"
							/>
						</label>
					)}
					<label>
						Adresse e-mail
						<Input
							type="email"
							autoComplete="email"
							required
							maxLength={180}
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="vous@exemple.fr"
						/>
					</label>
					<label>
						Mot de passe
						<Input
							type="password"
							autoComplete={isRegistering ? 'new-password' : 'current-password'}
							required
							minLength={isRegistering ? 8 : undefined}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={isRegistering ? '8 caractères minimum' : 'Votre mot de passe'}
						/>
					</label>
					{(error || initialError) && <p className="auth-error" role="alert">{error || initialError}</p>}
					<button className="auth-submit" type="submit" disabled={isSubmitting}>
						{isSubmitting && <LoaderCircle size={16} className="auth-spinner" />}
						{isSubmitting ? 'Connexion en cours…' : isRegistering ? 'Créer mon compte' : 'Se connecter'}
					</button>
				</form>

				<p className="auth-switch">
					{isRegistering ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
					<button
						type="button"
						onClick={() => {
							setIsRegistering(!isRegistering)
							setError('')
						}}
					>
						{isRegistering ? 'Se connecter' : 'Créer un compte'}
					</button>
				</p>
			</section>
		</main>
	)
}

export default AuthScreen
