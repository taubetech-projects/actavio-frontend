"use client";

import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAirtableBases } from "@/hooks/useAirtableBases";

interface AirtableBaseSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AirtableBaseSelector({
  value,
  onChange,
  disabled,
}: AirtableBaseSelectorProps) {
  const { bases, isLoading, error } = useAirtableBases();

  if (isLoading) {
    return (
      <div className="relative">
        <select
          disabled
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none focus-visible:outline-none cursor-not-allowed pr-9"
        >
          <option>Loading bases…</option>
        </select>
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
      </div>
    );
  }

  if (error || bases.length === 0) {
    return (
      <div className="space-y-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="appAbc123XYZ"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-orange-500 shrink-0" />
          {error?.includes("expired") || error?.includes("token") ? (
            <span>
              Token may be expired.{" "}
              <a href="/integrations" className="underline text-primary hover:text-primary/80">
                Reconnect Airtable
              </a>
            </span>
          ) : bases.length === 0 && !error ? (
            "No bases found — enter Base ID manually."
          ) : (
            "Could not load bases — enter Base ID manually."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-9 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select a base…</option>
        {bases.map((base) => (
          <option key={base.id} value={base.id}>
            {base.name} ({base.id})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
