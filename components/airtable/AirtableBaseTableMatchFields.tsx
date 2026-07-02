"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAirtableTables } from "@/hooks/useAirtableTables";
import type { AirtableRef } from "@/types/airtable";

interface AirtableBaseTableMatchFieldsProps {
  selectedBase: AirtableRef | null;
  selectedTable: AirtableRef | null;
  allAvailableBases: AirtableRef[];
  allAvailableTablesForSelectedBase: AirtableRef[];
  locked: boolean;
  onBaseChange: (base: AirtableRef | null) => void;
  onTableChange: (table: AirtableRef | null) => void;
  onTablesLoaded: (tables: AirtableRef[]) => void;
}

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-9 disabled:cursor-not-allowed disabled:opacity-50";

// Shared base/table selection UI for the SEARCH_AIRTABLE_RECORDS and CREATE_AIRTABLE_RECORD
// plan-preview cards. Both actions resolve to the same selectedBase/selectedTable +
// allAvailableBases/allAvailableTablesForSelectedBase shape, including the "refetch tables
// when the user picks a different base than the one the server resolved" behavior.
export function AirtableBaseTableMatchFields({
  selectedBase,
  selectedTable,
  allAvailableBases,
  allAvailableTablesForSelectedBase,
  locked,
  onBaseChange,
  onTableChange,
  onTablesLoaded,
}: AirtableBaseTableMatchFieldsProps) {
  const originalBaseId = useRef(selectedBase?.id ?? null).current;
  const baseChanged = selectedBase?.id !== originalBaseId;

  const { tables: refetchedTables, isLoading: tablesLoading, error: tablesError } = useAirtableTables(
    baseChanged ? selectedBase?.id ?? null : null
  );

  useEffect(() => {
    if (!baseChanged || tablesLoading) return;
    const nextTables: AirtableRef[] = refetchedTables.map((t) => ({ id: t.id, name: t.name }));
    const unchanged =
      nextTables.length === allAvailableTablesForSelectedBase.length &&
      nextTables.every((t, i) => t.id === allAvailableTablesForSelectedBase[i]?.id);
    if (unchanged) return;
    onTablesLoaded(nextTables);
  }, [baseChanged, tablesLoading, refetchedTables, allAvailableTablesForSelectedBase, onTablesLoaded]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Base</Label>
        {allAvailableBases.length === 0 ? (
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
              value={selectedBase?.id ?? ""}
              onChange={(e) => onBaseChange(allAvailableBases.find((b) => b.id === e.target.value) ?? null)}
              disabled={locked}
              className={selectClass}
            >
              <option value="" disabled>Select a base…</option>
              {allAvailableBases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
        {!selectedBase && allAvailableBases.length > 0 && (
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
        {allAvailableTablesForSelectedBase.length === 0 ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-orange-500 shrink-0" />
            {tablesError ?? "No tables available for this base."}
          </p>
        ) : (
          <div className="relative">
            <select
              value={selectedTable?.id ?? ""}
              onChange={(e) =>
                onTableChange(allAvailableTablesForSelectedBase.find((t) => t.id === e.target.value) ?? null)
              }
              disabled={locked}
              className={selectClass}
            >
              <option value="" disabled>Select a table…</option>
              {allAvailableTablesForSelectedBase.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
        {!selectedTable && allAvailableTablesForSelectedBase.length > 0 && (
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Could not find a matching table. Pick one above.
          </p>
        )}
      </div>
    </div>
  );
}
