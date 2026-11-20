/**
 * Raccourcis vers les types générés depuis l'OpenAPI (schema.d.ts, à ne pas modifier).
 * Quand l'OpenAPI est imprécise, le type est corrigé ici, en suivant docs/API-CONTRAT.md.
 */

import type { components } from './schema'

export type Schemas = components['schemas']

/** IRI d'une ressource, par exemple `/api/projets/0193…`. */
export type Iri = string
