"use client";

import { useState, useCallback } from "react";
import { executeAirtablePlan } from "@/lib/airtable/planExecutor";
import type { AirtableRecordsResult } from "@/types/airtable";

export interface FetchOptions {
  baseId: string;
  tableId: string;
  pageSize?: number;
  offset?: string | null;
  filterByFormula?: string | null;
}

export function useAirtableFetch() {
  const [result, setResult] = useState<AirtableRecordsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (options: FetchOptions): Promise<AirtableRecordsResult> => {
    setIsLoading(true);
    setError(null);

    const parts: string[] = [];
    parts.push(`Fetch Airtable records from base ${options.baseId}, table ${options.tableId}`);
    if (options.pageSize) parts.push(`limit ${options.pageSize} records`);
    if (options.offset) parts.push(`starting from offset ${options.offset}`);
    if (options.filterByFormula) parts.push(`where ${options.filterByFormula}`);
    const instructionText = parts.join(", ");

    try {
      const execResult = await executeAirtablePlan(instructionText);

      if (execResult.status === "FAILED") {
        const msg = execResult.messageUser ?? "Failed to fetch Airtable records.";
        setError(msg);
        throw new Error(msg);
      }

      const raw = execResult.raw as AirtableRecordsResult;
      setResult(raw);
      return raw;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { fetch, result, isLoading, error, reset };
}
