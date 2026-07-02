"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AirtableBaseTableMatchFields } from "./AirtableBaseTableMatchFields";
import { CONFIDENCE_STYLE } from "./confidenceStyle";
import type { SearchAirtableResolvedPayload } from "@/types/airtable";

interface AirtableSearchMatchCardProps {
  payload: SearchAirtableResolvedPayload;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  triggers: Array<{ phrase: string; maps_to?: string; meaning?: string }>;
  locked: boolean;
  onChange: (next: SearchAirtableResolvedPayload) => void;
}

export function AirtableSearchMatchCard({
  payload,
  confidence,
  triggers,
  locked,
  onChange,
}: AirtableSearchMatchCardProps) {
  const relevantTriggers = triggers.filter((t) => /AIRTABLE|BASE|TABLE|SEARCH/i.test(t.meaning ?? t.maps_to ?? ""));
  const cs = CONFIDENCE_STYLE[confidence];

  return (
    <div className="space-y-3">
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cs.className}`}>
        {cs.label}
      </span>

      <AirtableBaseTableMatchFields
        selectedBase={payload.selectedBase}
        selectedTable={payload.selectedTable}
        allAvailableBases={payload.allAvailableBases}
        allAvailableTablesForSelectedBase={payload.allAvailableTablesForSelectedBase}
        locked={locked}
        onBaseChange={(base) =>
          onChange({ ...payload, selectedBase: base, selectedTable: null, allAvailableTablesForSelectedBase: [] })
        }
        onTableChange={(table) => onChange({ ...payload, selectedTable: table })}
        onTablesLoaded={(tables) =>
          onChange({ ...payload, allAvailableTablesForSelectedBase: tables, selectedTable: tables[0] ?? null })
        }
      />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Search query</Label>
        <Input
          value={payload.searchQuery}
          onChange={(e) => onChange({ ...payload, searchQuery: e.target.value })}
          placeholder="Leave empty to fetch all records"
          disabled={locked}
          className="h-8 text-sm"
        />
      </div>

      {relevantTriggers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {relevantTriggers.map((t, i) => (
            <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              Why: &ldquo;{t.phrase}&rdquo; → {(t.meaning ?? t.maps_to ?? "").replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
