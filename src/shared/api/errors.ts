/**
 * Erreurs de l'API traduites en messages français pour l'interface.
 * Les messages bruts du back (souvent en anglais) ne sont jamais affichés,
 * sauf les messages de validation personnalisés, déjà rédigés en français.
 */

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
	readonly status: number
	/** Erreurs de validation (422), par chemin de propriété : `{ email: '…' }`. */
	readonly fieldErrors: FieldErrors

	constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.fieldErrors = fieldErrors
	}
}

/** L'API n'a pas pu être jointe (réseau coupé, serveur arrêté, certificat refusé). */
export class NetworkError extends Error {
	constructor() {
		super('Impossible de joindre le serveur Parchy. Vérifiez votre connexion, puis réessayez.')
		this.name = 'NetworkError'
	}
}

/** Action refusée côté front avant tout appel (message déjà rédigé pour l'auteur). */
export class ActionImpossible extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ActionImpossible'
	}
}

export const sessionExpiredMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
export const invalidCredentialsMessage = 'Adresse e-mail ou mot de passe incorrect.'

const statusMessages: Record<number, string> = {
	400: 'La demande envoyée est invalide.',
	401: sessionExpiredMessage,
	403: 'Vous n’avez pas accès à cet élément.',
	404: 'Cet élément est introuvable.',
	409: 'Ce contenu a été modifié entre-temps.',
	410: 'Ce fichier n’est plus disponible.',
	422: 'Certains champs sont invalides.',
	429: 'Vous avez atteint la limite de votre formule.',
}

export function messageForStatus(status: number): string {
	if (status >= 500) return 'Le serveur a rencontré une erreur. Réessayez dans un instant.'
	return statusMessages[status] ?? `La requête a échoué (code ${status}).`
}

/**
 * Codes des contraintes Symfony standards, dont les messages arrivent en anglais
 * tant que le back n'a pas de locale française.
 */
const constraintMessages: Record<string, string> = {
	'c1051bb4-d103-4f74-8988-acbcafc7fdc3': 'Ce champ est obligatoire.', // NotBlank
	'ad32d13f-c3d4-423b-909a-857b961eb720': 'Ce champ est obligatoire.', // NotNull
	'9ff3fdc4-b214-49db-8718-39c315e33d45': 'Cette valeur est trop courte.', // Length (min)
	'd94b19cc-114f-4f44-9cc4-4138e80a87b9': 'Cette valeur est trop longue.', // Length (max)
	'bd79c0ab-ddba-46cc-a703-a7a4b08de310': 'Cette adresse e-mail n’est pas valide.', // Email
	'8e179f1b-97aa-4560-a02f-2a8b42e49df7': 'Cette valeur n’est pas autorisée.', // Choice
}

interface Violation {
	propertyPath?: string
	message?: string
	code?: string
}

export function parseViolations(body: unknown): FieldErrors {
	const violations = (body as { violations?: Violation[] } | undefined)?.violations
	if (!Array.isArray(violations)) return {}

	const fieldErrors: FieldErrors = {}
	for (const violation of violations) {
		const field = violation.propertyPath || '_global'
		if (fieldErrors[field]) continue
		fieldErrors[field] = (violation.code && constraintMessages[violation.code]) || violation.message || 'Valeur invalide.'
	}
	return fieldErrors
}

/** Message à afficher pour n'importe quelle erreur levée par un appel à l'API. */
export function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError || error instanceof NetworkError || error instanceof ActionImpossible) return error.message
	return 'Une erreur inattendue est survenue.'
}
