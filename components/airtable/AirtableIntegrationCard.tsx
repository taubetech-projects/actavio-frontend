"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Unplug,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAirtableIntegration } from "@/hooks/useAirtableIntegration";

// Minimal Airtable SVG logo
function AirtableLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 170" fill="none" className={className}>
      <rect x="10" y="80" width="80" height="80" rx="8" fill="#FCB400" />
      <rect x="110" y="80" width="80" height="80" rx="8" fill="#18BFFF" />
      <rect x="10" y="10" width="180" height="60" rx="8" fill="#F82B60" />
      <text x="100" y="50" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold">
        Airtable
      </text>
    </svg>
  );
}

export function AirtableIntegrationCard() {
  const { integration, isLoading, isConnected, connect, disconnect } =
    useAirtableIntegration();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setActionError(null);
    try {
      await connect();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to initiate connection.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setActionError(null);
    try {
      await disconnect();
      setShowConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }

  const status = integration?.status ?? "DISCONNECTED";

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AirtableLogo className="h-10 w-10 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Airtable</h3>
              <p className="text-xs text-muted-foreground">
                Read and write records in your Airtable bases
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {status === "ERROR" && integration?.lastError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
            {integration.lastError}
          </p>
        )}

        {actionError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
            {actionError}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {status === "CONNECTED" ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/integrations/airtable/records">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Records
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/integrations/airtable/create">Create Record</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowConfirm(true)}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Unplug className="h-3.5 w-3.5 mr-1.5" />
                )}
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={connecting}
              className="focus-visible:ring-2 focus-visible:ring-ring"
            >
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {connecting ? "Connecting…" : status === "ERROR" ? "Reconnect" : "Connect Airtable"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Airtable?</DialogTitle>
            <DialogDescription>
              This will remove your access token. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CONNECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 shrink-0">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </span>
    );
  }
  if (status === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 shrink-0">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
      <WifiOff className="h-3 w-3" />
      Disconnected
    </span>
  );
}
