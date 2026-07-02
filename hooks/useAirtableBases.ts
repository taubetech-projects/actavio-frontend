"use client";

import { useState, useEffect, useCallback } from "react";
import { airtableMetaApi } from "@/lib/api";
import { useAirtableIntegration } from "./useAirtableIntegration";
import type { AirtableBaseItem } from "@/types/airtable";

export function useAirtableBases() {
  const { isConnected } = useAirtableIntegration();
  const [bases, setBases] = useState<AirtableBaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isConnected) {
      setBases([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await airtableMetaApi.getBases();
      setBases(data.bases ?? []);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "NOT_FOUND") {
        setError("Airtable integration not found. Please connect first.");
      } else if (e.code === "BAD_REQUEST") {
        setError("Airtable token may be expired. Please reconnect.");
      } else {
        setError(e.message ?? "Failed to load bases.");
      }
      setBases([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    load();
  }, [load]);

  return { bases, isLoading, error, refetch: load };
}
