"use client";

import { useState, useEffect, useCallback } from "react";
import { airtableMetaApi } from "@/lib/api";
import { useAirtableIntegration } from "./useAirtableIntegration";
import type { AirtableTableItem } from "@/types/airtable";

export function useAirtableTables(baseId: string | null) {
  const { isConnected } = useAirtableIntegration();
  const [tables, setTables] = useState<AirtableTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!baseId || !isConnected) {
      setTables([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await airtableMetaApi.getTables(baseId);
      setTables(data.tables ?? []);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "NOT_FOUND") {
        setError("Base not found or Airtable not connected.");
      } else if (e.code === "BAD_REQUEST") {
        setError("Airtable token may be expired. Please reconnect.");
      } else {
        setError(e.message ?? "Failed to load tables.");
      }
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  }, [baseId, isConnected]);

  useEffect(() => {
    load();
  }, [load]);

  return { tables, isLoading, error, refetch: load };
}
