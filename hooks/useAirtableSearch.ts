"use client";

import { useState, useCallback } from "react";
import { executeAirtablePlan } from "@/lib/airtable/planExecutor";
import type { SearchAirtablePayload, AirtableSearchResult } from "@/types/airtable";

export function useAirtableSearch() {
  const [result, setResult] = useState<AirtableSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (payload: SearchAirtablePayload): Promise<AirtableSearchResult> => {
      setIsLoading(true);
      setError(null);
      const instructionText = `Search for "${payload.searchText}" in Airtable base ${payload.baseId}, table ${payload.tableId}`;
      try {
        const execResult = await executeAirtablePlan(instructionText);
        if (execResult.status === "FAILED") {
          const msg = execResult.messageUser ?? "Search failed. Please try again.";
          setError(msg);
          throw new Error(msg);
        }
        const raw = execResult.raw as AirtableSearchResult;
        setResult(raw);
        return raw;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { search, result, isLoading, error, reset };
}
