import Dexie, { type EntityTable } from 'dexie'
import type { JSONContent } from '@tiptap/react'

/**
 * Texte d'une scène pas encore confirmé par le serveur.
 * Il existe tant que la dernière frappe n'a pas été enregistrée par l'API ;
 * il survit à la fermeture de l'onglet et à une coupure réseau.
 */
export interface Brouillon {
	sceneIri: string
	/** Compte propriétaire (claim du jeton) : un autre compte sur ce navigateur ne le voit pas. */
	proprietaire: string
	contenu: JSONContent
	/** Version serveur sur laquelle ce texte s'appuie (verrou optimiste). */
	versionBase: number
	/** Horodatage local de la dernière modification. */
	modifieLe: number
	/** true après un 409 tant que l'auteur n'a pas choisi quelle version garder. */
	conflit: boolean
}

class ParchyDb extends Dexie {
	brouillons!: EntityTable<Brouillon, 'sceneIri'>

	constructor() {
		super('parchy')
		this.version(1).stores({ brouillons: 'sceneIri, proprietaire' })
	}
}

export const db = new ParchyDb()
