"use client";

import { useState, useEffect, useCallback } from "react";
import { integrationsApi, type Integration } from "@/lib/api";

export function useAirtableIntegration() {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await integrationsApi.list();
      setIntegration(list.find((i) => i.provider === "AIRTABLE") ?? null);
    } catch {
      // leave previous value
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const connect = useCallback(async () => {
    const { authorizationUrl } = await integrationsApi.initiateOAuth("AIRTABLE");
    window.location.href = authorizationUrl;
  }, []);

  const disconnect = useCallback(async () => {
    await integrationsApi.disconnect("AIRTABLE");
    await refetch();
  }, [refetch]);

  const isConnected =
    integration?.status === "CONNECTED";

  return { integration, isLoading, isConnected, connect, disconnect, refetch };
}
