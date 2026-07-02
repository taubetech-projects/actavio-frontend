"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, X, RefreshCw, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { AirtableRecordsTable } from "@/components/airtable/AirtableRecordsTable";
import { AirtablePagination } from "@/components/airtable/AirtablePagination";
import { AirtableBaseSelector } from "@/components/airtable/AirtableBaseSelector";
import { AirtableTableSelector } from "@/components/airtable/AirtableTableSelector";
import { AirtableSearchBar } from "@/components/airtable/AirtableSearchBar";
import { useAirtableSearch } from "@/hooks/useAirtableSearch";
import { useAirtableIntegration } from "@/hooks/useAirtableIntegration";
import { useAuth } from "@/lib/auth-context";
import type { AirtableSearchResult } from "@/types/airtable";

export default function AirtableRecordsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const { isConnected, isLoading: integrationLoading } = useAirtableIntegration();

  const [baseId, setBaseId] = useState("");
  const [tableId, setTableId] = useState("");
  const [pageSize, setPageSize] = useState(20);

  const [searchResult, setSearchResult] = useState<AirtableSearchResult | null>(null);
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dismissedError, setDismissedError] = useState(false);

  const { search, isLoading: searchLoading, error: searchError, reset: resetSearch } = useAirtableSearch();

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  const handleBaseChange = (id: string) => {
    setBaseId(id);
    setTableId("");
  };

  const isLoading = searchLoading;

  const handleSearch = async (searchText: string) => {
    setDismissedError(false);
    try {
      const res = await search({
        baseId: baseId.trim(),
        tableId: tableId.trim(),
        searchText,
        pageSize: pageSize || 20,
      });
      setSearchResult(res);
      setActiveSearch(searchText);
      setCurrentPage(1);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      // error managed by hook
    }
  };

  const handleClearSearch = () => {
    resetSearch();
    setSearchResult(null);
    setActiveSearch(null);
  };

  const handleNextPage = async () => {
    if (!searchResult?.nextOffset || !activeSearch) return;
    const res = await search({
      baseId: baseId.trim(),
      tableId: tableId.trim(),
      searchText: activeSearch,
      pageSize: pageSize || 20,
      offset: searchResult.nextOffset,
    });
    setSearchResult(res);
    setCurrentPage((p) => p + 1);
  };

  const handleReset = () => {
    resetSearch();
    setSearchResult(null);
    setActiveSearch(null);
    setCurrentPage(1);
  };

  if (!initialized || !user) return null;

  const notConnectedGate = !integrationLoading && !isConnected;
  const canSearch = baseId.trim() && tableId.trim() && !notConnectedGate;
  const hasResult = !!searchResult;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Airtable Records</h1>
              <p className="text-muted-foreground text-sm">
                Search records in any base and table.
              </p>
            </div>
          </div>
          {hasResult && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Not connected warning */}
        {notConnectedGate && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                Airtable not connected
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">
                Connect your Airtable account first.{" "}
                <a href="/integrations" className="underline font-medium">
                  Go to Integrations →
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Query form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Query Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="baseId">Base</Label>
                <AirtableBaseSelector
                  value={baseId}
                  onChange={handleBaseChange}
                  disabled={notConnectedGate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tableId">Table</Label>
                <AirtableTableSelector
                  baseId={baseId || null}
                  value={tableId}
                  onChange={setTableId}
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
            </div>

            <AirtableSearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={searchLoading}
              activeSearch={activeSearch}
              disabled={!canSearch}
            />
          </CardContent>
        </Card>

        {/* Error banner */}
        {searchError && !dismissedError && (
          <ErrorBanner
            error={searchError}
            onDismiss={() => setDismissedError(true)}
            onRetry={() => activeSearch && handleSearch(activeSearch)}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && !hasResult && (
          <div className="rounded-lg border border-border p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {/* Results */}
        {searchResult && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {searchResult.recordCount}{" "}
                record{searchResult.recordCount !== 1 ? "s" : ""} found
              </span>
              {activeSearch && (
                <span className="text-xs text-muted-foreground">
                  — search results for &ldquo;{activeSearch}&rdquo;
                </span>
              )}
              {isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            <AirtableRecordsTable records={searchResult.records} />

            <AirtablePagination
              nextOffset={searchResult.nextOffset}
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
  const isRateLimit = /rate.limit|rate_limit|RATE_LIMITED/i.test(error);
  const isNotFound = /not.found|NOT_FOUND/i.test(error);
  const isTokenExpired = /TOKEN_EXPIRED|token.expired|expired/i.test(error);

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        {isTokenExpired ? (
          <>
            <p className="text-sm font-medium text-destructive">
              Your Airtable connection has expired. Please reconnect.
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
          <>
            <p className="text-sm text-destructive">
              The Airtable base or table was not found. Check your Base ID and Table ID.
            </p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </>
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
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        setFired(true);
        onRetry();
      }}
    >
      {fired ? "Retrying…" : `Auto-retry in ${countdown}s`}
    </Button>
  );
}
