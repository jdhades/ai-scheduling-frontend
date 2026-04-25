/**
 * SemanticRule — regla en lenguaje natural creada por el manager.
 *
 * - `priorityLevel`: 1=legal (hard), 2=semantic (hard), 3=preference (soft)
 * - `ruleType`: restriction | preference | requirement
 * - `expiresAt`: ISO string opcional; null = sin vencimiento
 */
export type RulePriority = 1 | 2 | 3;
export type RuleType = 'restriction' | 'preference' | 'requirement';

export interface SemanticRule {
  id: string;
  companyId: string;
  ruleText: string;
  priorityLevel: RulePriority;
  ruleType: RuleType;
  isActive: boolean;
  expiresAt: string | null;
  branchId: string | null;
  departmentId: string | null;
  hasEmbedding: boolean;
  hasStructure: boolean;
  structure: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string | null;
}

/** Item devuelto por GET /rules/semantic (lista; subset del aggregate). */
export interface SemanticRuleListItem {
  id: string;
  ruleText: string;
  priorityLevel: RulePriority;
  ruleType: RuleType;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateSemanticRulePayload {
  ruleText: string;
  priorityLevel: RulePriority;
  ruleType: RuleType;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
}

/** PATCH metadata barato (sin re-embedding). */
export interface UpdateSemanticRuleMetadataPayload {
  priorityLevel?: RulePriority;
  isActive?: boolean;
  expiresAt?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
}

/** PATCH caro: cambia el texto y dispara re-embed + re-extract structure. */
export interface UpdateSemanticRuleTextPayload {
  ruleText: string;
}

export interface CreateSemanticRuleResult {
  id: string;
  embeddingGenerated: boolean;
  isDuplicate: boolean;
  duplicateOfId?: string;
  structureExtracted: boolean;
  intent?: string;
}
