"use client";

import { useEffect, useRef, useState } from "react";
import { executionApi } from "@/lib/api";
import type { ExecutionRunResponse } from "@/types/execution";

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 30_000;

export function useExecutionResult(
  actionPlanId: string | null,
  enabled: boolean
) {
  const [result, setResult] = useState<ExecutionRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !actionPlanId) return;

    // Reset state for new plan
    setResult(null);
    setError(null);
    setTimedOut(false);

    const stop = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (timeoutRef.current)  { clearTimeout(timeoutRef.current);  timeoutRef.current  = null; }
    };

    const poll = async () => {
      try {
        const data = await executionApi.getLatest(actionPlanId);
        setResult(data);
        if (data.status === "SUCCESS" || data.status === "FAILED") stop();
      } catch {
        setError("Failed to fetch execution result. Please check back later.");
        stop();
      }
    };

    poll(); // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    timeoutRef.current  = setTimeout(() => {
      setTimedOut(true);
      stop();
    }, TIMEOUT_MS);

    return stop;
  }, [actionPlanId, enabled]);

  return { result, error, timedOut };
}
