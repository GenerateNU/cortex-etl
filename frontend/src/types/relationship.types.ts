import type { Classification } from './classification.types'

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many'

export interface Relationship {
  relationship_id: string
  tenant_id: string
  type: RelationshipType
  from_classification: Classification
  to_classification: Classification
}

export interface RelationshipCreate {
  tenant_id: string
  from_classification_id: string
  to_classification_id: string
  type: RelationshipType
}
