"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, X, Plus, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  AirtableDynamicFieldList,
  assembleFields,
  type FieldEntry,
} from "@/components/airtable/AirtableDynamicFieldList";
import { AirtableRecordsTable } from "@/components/airtable/AirtableRecordsTable";
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

  // Phase 1: target selection
  const [phase, setPhase] = useState<1 | 2>(1);
  const [baseId, setBaseId] = useState("");
  const [tableId, setTableId] = useState("");

  // Phase 2: field builder
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

  if (!initialized || !user) return null;

  const notConnectedGate = !integrationLoading && !isConnected;
  const assembled = assembleFields(fields);
  const canSubmit = Object.keys(assembled).length > 0 && !isLoading;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Airtable Record</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a new record to any base and table.
          </p>
        </div>

        {notConnectedGate && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Airtable not connected</p>
              <p className="text-xs text-orange-700 mt-1">
                Connect your Airtable account first.{" "}
                <a href="/integrations" className="underline">
                  Go to Integrations →
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {result && (
          <div ref={successRef} className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-green-800">
                  Record created successfully
                </p>
                <p className="text-xs text-green-700">
                  Record ID: <span className="font-mono">{result.record.id}</span>
                </p>
                {resultLink && (
                  <a
                    href={resultLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-700 underline hover:text-green-900"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View in Airtable
                  </a>
                )}
              </div>
            </div>

            <AirtableRecordsTable records={[result.record]} />

            <Button variant="outline" size="sm" onClick={handleReset}>
              Create another record
            </Button>
          </div>
        )}

        {/* Form */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {phase === 1 ? "Select Target" : (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPhase(1)}
                      className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-normal text-muted-foreground">
                      <span className="font-mono text-foreground">{baseId}</span>
                      {" › "}
                      <span className="font-mono text-foreground">{tableId}</span>
                    </span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phase === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="createBaseId">Base ID</Label>
                    <Input
                      id="createBaseId"
                      value={baseId}
                      onChange={(e) => setBaseId(e.target.value)}
                      placeholder="appAbc123XYZ"
                      disabled={notConnectedGate}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="createTableId">Table ID / Table Name</Label>
                    <Input
                      id="createTableId"
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      placeholder="tblCustomers or Customers"
                      disabled={notConnectedGate}
                      onKeyDown={(e) => e.key === "Enter" && handleContinue()}
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

                  {/* Error banner */}
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
                      Reset
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
  const isTokenExpired = error.toLowerCase().includes("token_expired") || error.toLowerCase().includes("expired");
  const isRateLimit = error.toLowerCase().includes("rate");

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
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
