"use client";

import { useState, useCallback } from "react";
import { executeAirtablePlan } from "@/lib/airtable/planExecutor";
import type { AirtableCreateResult, CreateAirtablePayload } from "@/types/airtable";

export function useAirtableCreate() {
  const [result, setResult] = useState<AirtableCreateResult | null>(null);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateAirtablePayload): Promise<AirtableCreateResult> => {
      setIsLoading(true);
      setError(null);

      const fieldSummary = Object.entries(payload.fields)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(", ")
        .slice(0, 200);

      const instructionText = `Create an Airtable record in base ${payload.baseId}, table ${payload.tableId} with the following fields: ${fieldSummary}`;

      try {
        const execResult = await executeAirtablePlan(instructionText);

        if (execResult.status === "FAILED") {
          const msg = execResult.messageUser ?? "Failed to create Airtable record.";
          setError(msg);
          throw Object.assign(new Error(msg), {
            errorCode: execResult.errorCode,
            messageUser: execResult.messageUser,
          });
        }

        const raw = execResult.raw as AirtableCreateResult;
        setResult(raw);
        setResultLink(execResult.link);
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
    setResultLink(null);
    setError(null);
  }, []);

  return { create, result, resultLink, isLoading, error, reset };
}
