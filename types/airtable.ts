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

// ── Fetch records ─────────────────────────────────────────────────────────────

export interface FetchAirtablePayload {
  baseId: string;
  tableId: string;
  pageSize?: number;
  offset?: string | null;
  filterByFormula?: string | null;
}

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

// ── Plan execution result ─────────────────────────────────────────────────────

export interface PlanExecutionResult {
  raw: unknown;
  link: string | null;
  errorCode: string | null;
  messageUser: string | null;
  status: "SUCCESS" | "FAILED";
}
