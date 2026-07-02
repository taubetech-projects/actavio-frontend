"use client";

import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAirtableTables } from "@/hooks/useAirtableTables";

interface AirtableTableSelectorProps {
  baseId: string | null;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AirtableTableSelector({
  baseId,
  value,
  onChange,
  disabled,
}: AirtableTableSelectorProps) {
  const { tables, isLoading, error } = useAirtableTables(baseId || null);

  if (!baseId) {
    return (
      <Input
        value=""
        readOnly
        placeholder="Select a base first"
        disabled
        className="opacity-60 cursor-not-allowed"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="relative">
        <select
          disabled
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none focus-visible:outline-none cursor-not-allowed pr-9"
        >
          <option>Loading tables…</option>
        </select>
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
      </div>
    );
  }

  if (error || tables.length === 0) {
    return (
      <div className="space-y-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="tblCustomers or Customers"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-orange-500 shrink-0" />
          {tables.length === 0 && !error
            ? "No tables found — enter Table ID or name manually."
            : "Could not load tables — enter Table ID or name manually."}
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
        <option value="">Select a table…</option>
        {tables.map((table) => (
          <option key={table.id} value={table.id}>
            {table.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
