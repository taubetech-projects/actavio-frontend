"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { AirtableRecordsTable } from "@/components/airtable/AirtableRecordsTable";
import { AirtablePagination } from "@/components/airtable/AirtablePagination";
import { useAirtableFetch } from "@/hooks/useAirtableFetch";
import { useAirtableIntegration } from "@/hooks/useAirtableIntegration";
import { useAuth } from "@/lib/auth-context";
import type { AirtableRecordsResult } from "@/types/airtable";

export default function AirtableRecordsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const { isConnected, isLoading: integrationLoading } = useAirtableIntegration();

  const [baseId, setBaseId] = useState("");
  const [tableId, setTableId] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [formula, setFormula] = useState("");

  const [result, setResult] = useState<AirtableRecordsResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dismissedError, setDismissedError] = useState(false);

  const { fetch, isLoading, error, reset } = useAirtableFetch();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  const handleFetch = async (offset?: string | null) => {
    setDismissedError(false);
    try {
      const res = await fetch({
        baseId: baseId.trim(),
        tableId: tableId.trim(),
        pageSize: pageSize || 20,
        offset: offset ?? null,
        filterByFormula: formula.trim() || null,
      });
      setResult(res);
      if (!offset) setCurrentPage(1);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      // error state is managed by the hook
    }
  };

  const handleNextPage = async () => {
    if (!result?.nextOffset) return;
    await handleFetch(result.nextOffset);
    setCurrentPage((p) => p + 1);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setCurrentPage(1);
  };

  if (!initialized || !user) return null;

  const notConnectedGate = !integrationLoading && !isConnected;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Airtable Records</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Fetch records from any base and table.
            </p>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>

        {notConnectedGate && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Airtable not connected</p>
              <p className="text-xs text-orange-700 mt-1">
                Connect your Airtable account first before fetching records.{" "}
                <a href="/integrations" className="underline">
                  Go to Integrations →
                </a>
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fetch Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="baseId">Base ID</Label>
                <Input
                  id="baseId"
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  placeholder="appAbc123XYZ"
                  disabled={notConnectedGate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tableId">Table ID / Table Name</Label>
                <Input
                  id="tableId"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  placeholder="tblCustomers or Customers"
                  disabled={notConnectedGate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pageSize">Page Size</Label>
                <Input
                  id="pageSize"
                  type="number"
                  min={1}
                  max={100}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  disabled={notConnectedGate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="formula">Filter by Formula (optional)</Label>
                <Input
                  id="formula"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder={`{Status}="Active"`}
                  disabled={notConnectedGate}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={() => handleFetch()}
                disabled={!baseId.trim() || !tableId.trim() || isLoading || notConnectedGate}
                className="focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Fetching…" : "Fetch Records"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && !dismissedError && (
          <ErrorBanner error={error} onDismiss={() => setDismissedError(true)} onRetry={() => handleFetch()} />
        )}

        {/* Loading skeleton */}
        {isLoading && !result && (
          <div className="space-y-2 rounded-md border border-border p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {result.recordCount} record{result.recordCount !== 1 ? "s" : ""} fetched
              </span>
            </div>
            <AirtableRecordsTable records={result.records} />
            <AirtablePagination
              nextOffset={result.nextOffset}
              currentPage={currentPage}
              isLoading={isLoading}
              onNextPage={handleNextPage}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ErrorBanner({
  error,
  onDismiss,
  onRetry,
}: {
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const isRateLimit = error.toLowerCase().includes("rate");
  const isNotFound = error.toLowerCase().includes("not found") || error.toLowerCase().includes("NOT_FOUND");
  const isTokenExpired = error.toLowerCase().includes("TOKEN_EXPIRED") || error.toLowerCase().includes("token_expired");

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        {isTokenExpired ? (
          <>
            <p className="text-sm font-medium text-destructive">
              Your Airtable connection has expired.
            </p>
            <Button size="sm" variant="outline" asChild>
              <a href="/integrations">Reconnect</a>
            </Button>
          </>
        ) : isRateLimit ? (
          <>
            <p className="text-sm font-medium text-destructive">
              Airtable rate limit reached. Please wait a few seconds and retry.
            </p>
            <AutoRetryButton onRetry={onRetry} />
          </>
        ) : isNotFound ? (
          <p className="text-sm text-destructive">
            The Airtable base or table was not found. Check your Base ID and Table ID.
          </p>
        ) : (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!isRateLimit && !isTokenExpired && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AutoRetryButton({ onRetry }: { onRetry: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (fired) return;
    if (countdown <= 0) {
      setFired(true);
      onRetry();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, fired, onRetry]);

  return (
    <Button size="sm" variant="outline" onClick={() => { setFired(true); onRetry(); }}>
      {fired ? "Retrying…" : `Auto-retry in ${countdown}s`}
    </Button>
  );
}
