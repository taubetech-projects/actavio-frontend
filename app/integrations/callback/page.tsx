"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Human-readable labels for each provider value the backend may return.
const PROVIDER_LABELS: Record<string, string> = {
  GOOGLE_CALENDAR: "Google Calendar",
  GMAIL: "Gmail",
  HUBSPOT: "HubSpot",
  SLACK: "Slack",
  NOTION: "Notion",
  OUTLOOK_CALENDAR: "Outlook Calendar",
  OUTLOOK_MAIL: "Outlook Mail",
};

// Maps backend error codes to user-facing copy.
const ERROR_COPY: Record<string, string> = {
  access_denied:
    "You declined to grant access. No changes were made — you can try again whenever you're ready.",
  token_exchange_failed:
    "We couldn't retrieve access tokens from the provider. Please try connecting again.",
  state_mismatch:
    "Security validation failed (the request may have expired). Please initiate the connection again.",
  integration_not_found:
    "The integration record was not found. Please try connecting again.",
};

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get("success") === "true";
  const errorCode = searchParams.get("error") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const providerLabel = PROVIDER_LABELS[provider] ?? provider;

  const errorMessage =
    ERROR_COPY[errorCode] ??
    (errorCode ? "An unexpected error occurred. Please try again." : null);

  // Auto-navigate to settings after a short delay on success.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.push("/dashboard/settings"), 3000);
    return () => clearTimeout(timer);
  }, [success, router]);

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            {providerLabel ? `${providerLabel} connected` : "Integration connected"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Actavio can now act on your behalf. Redirecting to settings&hellip;
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/settings")}
        >
          Go to Settings
        </Button>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Connection failed</h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/settings")}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={() => router.push("/dashboard/settings")}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // No recognizable params — user landed here directly.
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Nothing to show</h1>
        <p className="text-sm text-muted-foreground">
          This page is only reached after an OAuth flow.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/dashboard/settings")}
      >
        Go to Settings
      </Button>
    </div>
  );
}

export default function IntegrationCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-10 shadow-sm">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processing&hellip;</p>
            </div>
          }
        >
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
