"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AirtableBaseTableMatchFields } from "./AirtableBaseTableMatchFields";
import { AirtableDynamicFieldList, assembleFields, type FieldEntry } from "./AirtableDynamicFieldList";
import { CONFIDENCE_STYLE } from "./confidenceStyle";
import type { CreateAirtableResolvedPayload } from "@/types/airtable";
import { nanoid } from "nanoid";

interface AirtableCreateRecordCardProps {
  payload: CreateAirtableResolvedPayload;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  triggers: Array<{ phrase: string; maps_to?: string; meaning?: string }>;
  locked: boolean;
  onChange: (next: CreateAirtableResolvedPayload) => void;
}

function fieldsToEntries(fields: Record<string, unknown>): FieldEntry[] {
  const entries = Object.entries(fields);
  if (entries.length === 0) return [{ id: nanoid(), key: "", value: "" }];
  return entries.map(([key, value]) => ({ id: nanoid(), key, value: String(value ?? "") }));
}

export function AirtableCreateRecordCard({
  payload,
  confidence,
  triggers,
  locked,
  onChange,
}: AirtableCreateRecordCardProps) {
  const [fieldEntries, setFieldEntries] = useState<FieldEntry[]>(() => fieldsToEntries(payload.fields));

  const handleFieldsChange = (entries: FieldEntry[]) => {
    setFieldEntries(entries);
    onChange({ ...payload, fields: assembleFields(entries) });
  };

  const addField = () => {
    handleFieldsChange([...fieldEntries, { id: nanoid(), key: "", value: "" }]);
  };

  const relevantTriggers = triggers.filter((t) => /AIRTABLE|BASE|TABLE|RECORD/i.test(t.meaning ?? t.maps_to ?? ""));
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
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Record fields</Label>
          <button
            type="button"
            onClick={addField}
            disabled={locked}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" />
            Add field
          </button>
        </div>
        <AirtableDynamicFieldList fields={fieldEntries} onChange={handleFieldsChange} disabled={locked} />
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
