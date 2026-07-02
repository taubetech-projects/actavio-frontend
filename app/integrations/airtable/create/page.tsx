"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, CheckCircle2, X, Plus, ChevronLeft, ExternalLink, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  AirtableDynamicFieldList,
  assembleFields,
  type FieldEntry,
} from "@/components/airtable/AirtableDynamicFieldList";
import { AirtableRecordsTable } from "@/components/airtable/AirtableRecordsTable";
import { AirtableBaseSelector } from "@/components/airtable/AirtableBaseSelector";
import { AirtableTableSelector } from "@/components/airtable/AirtableTableSelector";
import { useAirtableCreate } from "@/hooks/useAirtableCreate";
import { useAirtableIntegration } from "@/hooks/useAirtableIntegration";
import { useAuth } from "@/lib/auth-context";
import { nanoid } from "nanoid";

function makeEntry(): FieldEntry {
  return { id: nanoid(), key: "", value: "" };
}

export default function AirtableCreatePage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const { isConnected, isLoading: integrationLoading } = useAirtableIntegration();

  const [phase, setPhase] = useState<1 | 2>(1);
  const [baseId, setBaseId] = useState("");
  const [tableId, setTableId] = useState("");

  const [fields, setFields] = useState<FieldEntry[]>([makeEntry(), makeEntry()]);
  const [dismissedError, setDismissedError] = useState(false);

  const { create, result, resultLink, isLoading, error, reset } = useAirtableCreate();
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  useEffect(() => {
    if (result) {
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [result]);

  const handleBaseChange = (id: string) => {
    setBaseId(id);
    setTableId("");
  };

  const handleContinue = () => {
    if (baseId.trim() && tableId.trim()) setPhase(2);
  };

  const handleCreate = async () => {
    setDismissedError(false);
    const assembled = assembleFields(fields);
    if (Object.keys(assembled).length === 0) return;
    try {
      await create({ baseId: baseId.trim(), tableId: tableId.trim(), fields: assembled });
    } catch {
      // error handled in hook
    }
  };

  const handleReset = () => {
    reset();
    setFields([makeEntry(), makeEntry()]);
    setDismissedError(false);
  };

  const handleStartOver = () => {
    handleReset();
    setPhase(1);
    setBaseId("");
    setTableId("");
  };

  if (!initialized || !user) return null;

  const notConnectedGate = !integrationLoading && !isConnected;
  const assembled = assembleFields(fields);
  const canSubmit = Object.keys(assembled).length > 0 && !isLoading;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Airtable Record</h1>
            <p className="text-muted-foreground text-sm">
              Add a new record to any base and table.
            </p>
          </div>
        </div>

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

        {/* Success state */}
        {result && (
          <div ref={successRef} className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Record created successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Record ID:{" "}
                  <span className="font-mono bg-green-100 dark:bg-green-900/40 rounded px-1">
                    {result.record.id}
                  </span>
                </p>
                {resultLink && (
                  <a
                    href={resultLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 underline hover:text-green-900 dark:hover:text-green-200"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View in Airtable
                  </a>
                )}
              </div>
            </div>

            <AirtableRecordsTable records={[result.record]} />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Create another record
              </Button>
              <Button variant="ghost" size="sm" onClick={handleStartOver}>
                Change base / table
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {phase === 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPhase(1)}
                      className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-normal text-muted-foreground">
                      <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 text-foreground">
                        {baseId}
                      </span>
                      <span className="mx-1.5 text-muted-foreground">›</span>
                      <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 text-foreground">
                        {tableId}
                      </span>
                    </span>
                  </>
                ) : (
                  "Select Target"
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {phase === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label>Base</Label>
                    <AirtableBaseSelector
                      value={baseId}
                      onChange={handleBaseChange}
                      disabled={notConnectedGate}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Table</Label>
                    <AirtableTableSelector
                      baseId={baseId || null}
                      value={tableId}
                      onChange={setTableId}
                      disabled={notConnectedGate}
                    />
                  </div>
                  <Button
                    onClick={handleContinue}
                    disabled={!baseId.trim() || !tableId.trim() || notConnectedGate}
                    className="focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Continue
                  </Button>
                </>
              )}

              {phase === 2 && (
                <>
                  <AirtableDynamicFieldList fields={fields} onChange={setFields} />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFields((f) => [...f, makeEntry()])}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Field
                  </Button>

                  {error && !dismissedError && (
                    <CreateErrorBanner
                      error={error}
                      onDismiss={() => setDismissedError(true)}
                      onRetry={handleCreate}
                    />
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleCreate}
                      disabled={!canSubmit || notConnectedGate}
                      className="focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Creating…" : "Create Record"}
                    </Button>
                    <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
                      Reset Fields
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function CreateErrorBanner({
  error,
  onDismiss,
  onRetry,
}: {
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const isTokenExpired = /TOKEN_EXPIRED|token.expired|expired/i.test(error);
  const isRateLimit = /rate.limit|rate_limit|RATE_LIMITED/i.test(error);

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
