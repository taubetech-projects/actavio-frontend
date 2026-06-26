"use client";

import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { AirtableIntegrationCard } from "@/components/airtable/AirtableIntegrationCard";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IntegrationsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  if (!initialized || !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect external services to let Actavio act on your behalf.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Data & Productivity
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AirtableIntegrationCard />
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          More integrations (Gmail, Google Calendar, LinkedIn, and others) are managed from{" "}
          <a href="/dashboard/settings" className="underline hover:text-foreground">
            Settings → Integrations
          </a>
          .
        </p>
      </div>
    </DashboardLayout>
  );
}
