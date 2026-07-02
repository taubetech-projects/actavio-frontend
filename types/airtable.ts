// ── Airtable field value types ────────────────────────────────────────────────

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small: { url: string; width: number; height: number };
    large: { url: string; width: number; height: number };
  };
}

export type AirtableFieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | AirtableAttachment[]
  | Record<string, unknown>;

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, AirtableFieldValue>;
}

// ── Records result (shared base for search results) ────────────────────────────

export interface AirtableRecordsResult {
  baseId: string;
  tableId: string;
  recordCount: number;
  records: AirtableRecord[];
  nextOffset: string | null;
}

// ── Create record ─────────────────────────────────────────────────────────────

export interface CreateAirtablePayload {
  baseId: string;
  tableId: string;
  fields: Record<string, unknown>;
}

export interface AirtableCreateResult {
  baseId: string;
  tableId: string;
  record: AirtableRecord;
}

// ── Search records ────────────────────────────────────────────────────────────

export interface SearchAirtablePayload {
  baseId: string;
  tableId: string;
  searchText: string;
  pageSize?: number;
  offset?: string | null;
}

export interface AirtableSearchResult extends AirtableRecordsResult {
  searchText: string;
}

// ── Metadata: bases & tables ──────────────────────────────────────────────────

export interface AirtableBaseItem {
  id: string;
  name: string;
  permissionLevel: string | null;
}

export interface AirtableBasesResponse {
  bases: AirtableBaseItem[];
  baseCount: number;
}

export interface AirtableTableItem {
  id: string;
  name: string;
}

export interface AirtableTablesResponse {
  baseId: string;
  tables: AirtableTableItem[];
  tableCount: number;
}

// ── Plan execution result ─────────────────────────────────────────────────────

export interface PlanExecutionResult {
  raw: unknown;
  link: string | null;
  errorCode: string | null;
  messageUser: string | null;
  status: "SUCCESS" | "FAILED";
}

// ── Search-intent resolution (action-plan preview payload correction) ──────────

export interface AirtableRef {
  id: string;
  name: string;
}

export interface SearchAirtableResolvedPayload {
  selectedBase: AirtableRef | null;
  selectedTable: AirtableRef | null;
  searchQuery: string;
  allAvailableBases: AirtableRef[];
  allAvailableTablesForSelectedBase: AirtableRef[];
  baseId?: string;
  tableId?: string;
  searchText?: string;
  pageSize?: number;
  offset?: string | null;
  filterByFormula?: string | null;
}
