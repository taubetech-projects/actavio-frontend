"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FieldValueCell } from "./FieldValueCell";
import { formatDistanceToNow } from "@/lib/airtable/dateUtils";
import type { AirtableRecord } from "@/types/airtable";

interface AirtableRecordsTableProps {
  records: AirtableRecord[];
}

type SortDir = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  dir: SortDir;
}

export function AirtableRecordsTable({ records }: AirtableRecordsTableProps) {
  const [sortState, setSortState] = useState<SortState>({ column: null, dir: null });
  const [search, setSearch] = useState("");

  const columns = useMemo(() => {
    const fieldKeys = new Set<string>();
    records.forEach((r) => Object.keys(r.fields).forEach((k) => fieldKeys.add(k)));
    return Array.from(fieldKeys);
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) => {
      if (r.id.toLowerCase().includes(q)) return true;
      return Object.values(r.fields).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const sortedRecords = useMemo(() => {
    if (!sortState.column || !sortState.dir) return filteredRecords;
    const col = sortState.column;
    const dir = sortState.dir === "asc" ? 1 : -1;
    return [...filteredRecords].sort((a, b) => {
      const av = col === "id" ? a.id : col === "createdTime" ? a.createdTime : String(a.fields[col] ?? "");
      const bv = col === "id" ? b.id : col === "createdTime" ? b.createdTime : String(b.fields[col] ?? "");
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [filteredRecords, sortState]);

  const handleSort = (col: string) => {
    setSortState((prev) => {
      if (prev.column !== col) return { column: col, dir: "asc" };
      if (prev.dir === "asc") return { column: col, dir: "desc" };
      return { column: null, dir: null };
    });
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortState.column !== col) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortState.dir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <svg className="h-16 w-16 text-muted-foreground" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="20" x2="56" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="24" y1="8" x2="24" y2="56" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="text-muted-foreground">No records found in this table.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search records…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
              {["id", "createdTime", ...columns].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, idx) => (
              <tr
                key={record.id}
                className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="px-3 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {record.id}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span title={record.createdTime} className="text-muted-foreground text-xs">
                    {formatDistanceToNow(record.createdTime)}
                  </span>
                </td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 max-w-xs">
                    <FieldValueCell
                      value={record.fields[col] ?? null}
                      columnName={col}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {sortedRecords.map((record, idx) => (
          <div
            key={record.id}
            className="rounded-md border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{record.id}</span>
              <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                #{idx + 1}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Created: <span title={record.createdTime}>{formatDistanceToNow(record.createdTime)}</span>
            </div>
            {columns.map((col) => (
              <div key={col} className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium text-muted-foreground truncate">{col}</span>
                <span>
                  <FieldValueCell value={record.fields[col] ?? null} columnName={col} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
