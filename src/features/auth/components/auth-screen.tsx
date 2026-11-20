import { useState, type FormEvent } from 'react'
import { BookOpen, LoaderCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import { useLogin, useRegister } from '../hooks'
import './auth-screen.css'

interface AuthScreenProps {
	/** Message affiché à l'arrivée, par exemple « session expirée ». */
	initialError?: string
}

function AuthScreen({ initialError = '' }: AuthScreenProps) {
	const [isRegistering, setIsRegistering] = useState(false)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const login = useLogin()
	const register = useRegister()

	const mutation = isRegistering ? register : login
	const error = mutation.error
	const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
	const hasFieldErrors = Object.keys(fieldErrors).some((field) => field !== '_global')
	const globalError = error
		? fieldErrors._global ?? (hasFieldErrors ? '' : getErrorMessage(error))
		: initialError

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (mutation.isPending) return

		if (isRegistering) {
			register.mutate({ email: email.trim(), motDePasse: password, nomAffichage: name.trim() })
		} else {
			login.mutate({ email: email.trim(), motDePasse: password })
		}
	}

	function switchMode() {
		setIsRegistering(!isRegistering)
		login.reset()
		register.reset()
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
								aria-invalid={Boolean(fieldErrors.nomAffichage)}
							/>
							{fieldErrors.nomAffichage && <span className="auth-field-error">{fieldErrors.nomAffichage}</span>}
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
							aria-invalid={Boolean(fieldErrors.email)}
						/>
						{fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
					</label>
					<label>
						Mot de passe
						<Input
							type="password"
							autoComplete={isRegistering ? 'new-password' : 'current-password'}
							required
							minLength={isRegistering ? 8 : undefined}
							maxLength={4096}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={isRegistering ? '8 caractères minimum' : 'Votre mot de passe'}
							aria-invalid={Boolean(fieldErrors.motDePasse)}
						/>
						{fieldErrors.motDePasse && <span className="auth-field-error">{fieldErrors.motDePasse}</span>}
					</label>
					{globalError && <p className="auth-error" role="alert">{globalError}</p>}
					<button className="auth-submit" type="submit" disabled={mutation.isPending}>
						{mutation.isPending && <LoaderCircle size={16} className="auth-spinner" />}
						{mutation.isPending
							? isRegistering ? 'Création du compte…' : 'Connexion en cours…'
							: isRegistering ? 'Créer mon compte' : 'Se connecter'}
					</button>
				</form>

				<p className="auth-switch">
					{isRegistering ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
					<button type="button" onClick={switchMode}>
						{isRegistering ? 'Se connecter' : 'Créer un compte'}
					</button>
				</p>
			</section>
		</main>
	)
}

export default AuthScreen
