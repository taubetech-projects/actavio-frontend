"use client";

import { useId } from "react";
import { X, Phone, Mail } from "lucide-react";
import { COMMON_AIRTABLE_FIELDS } from "@/lib/airtable/constants";
import { isPhoneNumber, isEmail } from "@/lib/airtable/detectors";

export interface FieldEntry {
  id: string;
  key: string;
  value: string;
}

interface AirtableDynamicFieldListProps {
  fields: FieldEntry[];
  onChange: (fields: FieldEntry[]) => void;
}

export function AirtableDynamicFieldList({
  fields,
  onChange,
}: AirtableDynamicFieldListProps) {
  const listId = useId();
  const datalistId = `${listId}-fields`;

  const duplicateKeys = getDuplicateKeys(fields);

  const update = (id: string, patch: Partial<FieldEntry>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const remove = (id: string) => {
    if (fields.length <= 1) return;
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      <datalist id={datalistId}>
        {COMMON_AIRTABLE_FIELDS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      {fields.map((field) => {
        const isDuplicate = duplicateKeys.has(field.key.trim()) && field.key.trim() !== "";
        const valueIsPhone = isPhoneNumber(field.value);
        const valueIsEmail = isEmail(field.value);

        return (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={field.key}
                onChange={(e) => update(field.id, { key: e.target.value })}
                list={datalistId}
                placeholder="e.g. Name"
                className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex-1 min-w-0 relative">
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => update(field.id, { value: e.target.value })}
                  placeholder="e.g. Ada Lovelace"
                  className="w-full rounded-md border border-input bg-background pl-3 pr-9 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {valueIsPhone && (
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
                )}
                {!valueIsPhone && valueIsEmail && (
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(field.id)}
                disabled={fields.length <= 1}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Remove field"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isDuplicate && (
              <p className="text-xs text-destructive pl-1">Duplicate field name</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getDuplicateKeys(fields: FieldEntry[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const f of fields) {
    const k = f.key.trim();
    if (!k) continue;
    if (seen.has(k)) dupes.add(k);
    else seen.add(k);
  }
  return dupes;
}

export function assembleFields(entries: FieldEntry[]): Record<string, string> {
  const seen = new Set<string>();
  const result: Record<string, string> = {};
  for (const entry of entries) {
    const k = entry.key.trim();
    const v = entry.value;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    result[k] = v;
  }
  return result;
}
