import { ExternalLink } from "lucide-react";
import type { ActionResultResponse } from "@/types/execution";
import { AirtableRecordsTable } from "@/components/airtable/AirtableRecordsTable";
import type { AirtableRecord } from "@/types/airtable";

interface ExecutionDataRendererProps {
  action: ActionResultResponse;
}

export function ExecutionDataRenderer({ action }: ExecutionDataRendererProps) {
  if (action.status === "FAILED") {
    return (
      <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {action.errorMessage ?? action.errorCode ?? "Unknown error"}
      </div>
    );
  }

  const data = action.data;
  if (!data) return null;

  // ── Airtable: FETCH_AIRTABLE_RECORDS ─────────────────────────────────────────
  const records = data.records;
  if (Array.isArray(records) && records.length > 0) {
    const airtableRecords = records as AirtableRecord[];
    const nextOffset = (data.nextOffset as string | null) ?? null;

    return (
      <div className="space-y-2">
        <AirtableRecordsTable records={airtableRecords} />
        {nextOffset && (
          <p className="text-xs text-muted-foreground">
            More records available — use the Airtable Records page to paginate.
          </p>
        )}
      </div>
    );
  }

  // ── Airtable: CREATE_AIRTABLE_RECORD ─────────────────────────────────────────
  const createdRecord = data.record as AirtableRecord | undefined;
  if (createdRecord && typeof createdRecord === "object" && "fields" in createdRecord) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Record ID: <span className="font-mono">{createdRecord.id}</span>
        </p>
        {action.link && (
          <a
            href={action.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View in Airtable
          </a>
        )}
        <AirtableRecordsTable records={[createdRecord]} />
      </div>
    );
  }

  // ── Generic key-value / JSON fallback ─────────────────────────────────────────
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;

  return (
    <pre className="rounded bg-muted/50 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
