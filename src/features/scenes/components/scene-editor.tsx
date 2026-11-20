import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Skeleton } from '@/components/ui/skeleton'
import * as sync from '@/sync'
import type { SceneDetail } from '../api'
import { useEtatSync } from '../hooks'

/**
 * Charge le texte à afficher : le brouillon local s'il existe (écrit hors ligne
 * ou pas encore envoyé), sinon le texte du serveur.
 */
function SceneEditor({ scene, onMots }: { scene: SceneDetail; onMots: (mots: number) => void }) {
	const [initial, setInitial] = useState<JSONContent | null>(null)
	const iri = scene['@id']

	useEffect(() => {
		let actif = true
		void sync.lireBrouillon(iri).then((brouillon) => {
			if (actif) setInitial(brouillon?.contenu ?? scene.contenu)
		})
		return () => { actif = false }
		// Le texte initial n'est lu qu'une fois par scène ; ensuite l'éditeur fait foi.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [iri])

	if (!initial) return <div className="scene-editor-loading"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
	return <Editeur iri={iri} version={scene.version ?? 1} contenuInitial={initial} onMots={onMots} />
}

function compterMots(texte: string): number {
	return texte.split(/\s+/).filter((mot) => /[\p{L}\p{N}]/u.test(mot)).length
}

function Editeur({ iri, version, contenuInitial, onMots }: { iri: string; version: number; contenuInitial: JSONContent; onMots: (mots: number) => void }) {
	const etat = useEtatSync(iri)
	const versionRef = useRef(version)
	const onMotsRef = useRef(onMots)

	useEffect(() => {
		versionRef.current = version
		onMotsRef.current = onMots
	})

	const editor = useEditor({
		extensions: [
			StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }),
			Placeholder.configure({ placeholder: 'Commencez à écrire votre scène…' }),
		],
		content: contenuInitial,
		editorProps: { attributes: { 'aria-label': 'Texte de la scène', class: 'scene-prose' } },
		onCreate: ({ editor: e }) => onMotsRef.current(compterMots(e.getText())),
		// L'éditeur n'écrit que dans sync/ : jamais d'appel direct à l'API.
		onUpdate: ({ editor: e }) => {
			sync.modifier(iri, e.getJSON(), versionRef.current)
			onMotsRef.current(compterMots(e.getText()))
		},
	})

	// En conflit, on fige le texte jusqu'au choix de l'auteur.
	useEffect(() => {
		editor?.setEditable(etat.statut !== 'conflit')
	}, [editor, etat.statut])

	// Texte remplacé par le serveur (conflit résolu en faveur du serveur, version restaurée).
	useEffect(() => {
		if (!editor) return
		return sync.ecouter({
			remplace: (scene) => {
				if (scene['@id'] !== iri) return
				editor.commands.setContent(scene.contenu, { emitUpdate: false })
				onMotsRef.current(compterMots(editor.getText()))
			},
		})
	}, [editor, iri])

	return <EditorContent editor={editor} className="scene-editor" />
}

export default SceneEditor
