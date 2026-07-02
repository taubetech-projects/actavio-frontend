"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAirtableTables } from "@/hooks/useAirtableTables";
import type { AirtableRef, SearchAirtableResolvedPayload } from "@/types/airtable";

interface AirtableSearchMatchCardProps {
  payload: SearchAirtableResolvedPayload;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  triggers: Array<{ phrase: string; maps_to: string }>;
  locked: boolean;
  onChange: (next: SearchAirtableResolvedPayload) => void;
}

const CONFIDENCE_STYLE: Record<"HIGH" | "MEDIUM" | "LOW", { label: string; className: string }> = {
  HIGH:   { label: "High confidence",                className: "bg-success/10 text-success" },
  MEDIUM: { label: "Medium confidence",               className: "bg-yellow-500/10 text-yellow-600" },
  LOW:    { label: "Low confidence — please review",  className: "bg-destructive/10 text-destructive" },
};

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-9 disabled:cursor-not-allowed disabled:opacity-50";

export function AirtableSearchMatchCard({
  payload,
  confidence,
  triggers,
  locked,
  onChange,
}: AirtableSearchMatchCardProps) {
  const originalBaseId = useRef(payload.selectedBase?.id ?? null).current;
  const baseChanged = payload.selectedBase?.id !== originalBaseId;

  const { tables: refetchedTables, isLoading: tablesLoading, error: tablesError } = useAirtableTables(
    baseChanged ? payload.selectedBase?.id ?? null : null
  );

  useEffect(() => {
    if (!baseChanged || tablesLoading) return;
    const nextTables: AirtableRef[] = refetchedTables.map((t) => ({ id: t.id, name: t.name }));
    const unchanged =
      nextTables.length === payload.allAvailableTablesForSelectedBase.length &&
      nextTables.every((t, i) => t.id === payload.allAvailableTablesForSelectedBase[i]?.id);
    if (unchanged) return;
    onChange({
      ...payload,
      allAvailableTablesForSelectedBase: nextTables,
      selectedTable: nextTables[0] ?? null,
    });
  }, [baseChanged, tablesLoading, refetchedTables, payload, onChange]);

  const handleBaseChange = (baseId: string) => {
    const base = payload.allAvailableBases.find((b) => b.id === baseId) ?? null;
    onChange({ ...payload, selectedBase: base, selectedTable: null, allAvailableTablesForSelectedBase: [] });
  };

  const handleTableChange = (tableId: string) => {
    const table = payload.allAvailableTablesForSelectedBase.find((t) => t.id === tableId) ?? null;
    onChange({ ...payload, selectedTable: table });
  };

  const relevantTriggers = triggers.filter((t) => /AIRTABLE|BASE|TABLE|SEARCH/i.test(t.maps_to ?? ""));
  const cs = CONFIDENCE_STYLE[confidence];

  return (
    <div className="space-y-3">
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cs.className}`}>
        {cs.label}
      </span>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Base</Label>
          {payload.allAvailableBases.length === 0 ? (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
              <span>
                No Airtable bases available — check your Airtable connection.{" "}
                <a href="/integrations" className="underline text-primary hover:text-primary/80">
                  Connect Airtable
                </a>
              </span>
            </p>
          ) : (
            <div className="relative">
              <select
                value={payload.selectedBase?.id ?? ""}
                onChange={(e) => handleBaseChange(e.target.value)}
                disabled={locked}
                className={selectClass}
              >
                <option value="" disabled>Select a base…</option>
                {payload.allAvailableBases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          {!payload.selectedBase && payload.allAvailableBases.length > 0 && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Could not find a matching Airtable base. Pick one above.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            Table
            {baseChanged && tablesLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </Label>
          {payload.allAvailableTablesForSelectedBase.length === 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 text-orange-500 shrink-0" />
              {tablesError ?? "No tables available for this base."}
            </p>
          ) : (
            <div className="relative">
              <select
                value={payload.selectedTable?.id ?? ""}
                onChange={(e) => handleTableChange(e.target.value)}
                disabled={locked}
                className={selectClass}
              >
                <option value="" disabled>Select a table…</option>
                {payload.allAvailableTablesForSelectedBase.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          {!payload.selectedTable && payload.allAvailableTablesForSelectedBase.length > 0 && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Could not find a matching table. Pick one above.
            </p>
          )}
        </div>
      </div>

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
              Why: &ldquo;{t.phrase}&rdquo; → {t.maps_to.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
