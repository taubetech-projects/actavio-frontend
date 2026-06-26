"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { actionPlansApi, type ActionPlanSummary, type ActionPlanStatus, type RiskLevel } from "@/lib/api";

const PAGE_SIZE = 20;

function statusVariant(status: ActionPlanStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DRAFT": return "secondary";
    case "CONFIRMED": return "outline";
    case "EXECUTING": return "outline";
    case "SUCCESS": return "default";
    case "COMPLETED": return "default";
    case "FAILED": return "destructive";
    case "CANCELLED": return "secondary";
    case "PENDING": return "secondary";
    case "RUNNING": return "outline";
  }
}

function statusLabel(status: ActionPlanStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case "LOW": return "text-green-600 dark:text-green-400";
    case "MEDIUM": return "text-amber-600 dark:text-amber-400";
    case "HIGH": return "text-red-600 dark:text-red-400";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MyActionPlansPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [plans, setPlans] = useState<ActionPlanSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.push("/login");
  }, [user, initialized, router]);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await actionPlansApi.list(p, PAGE_SIZE);
      setPlans(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch {
      setError("Failed to load action plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user) load(0);
  }, [initialized, user, load]);

  if (!initialized || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Action Plans</h1>
            {!isLoading && !error && (
              <p className="text-muted-foreground">
                {totalElements} {totalElements === 1 ? "plan" : "plans"}
              </p>
            )}
          </div>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Action Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => load(page)}>
                  Retry
                </Button>
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">No action plans yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the AI Assistant to create your first action plan.
                </p>
                <Button asChild className="mt-4" variant="outline" size="sm">
                  <Link href="/dashboard/action-plans">Go to AI Assistant</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/my-action-plans/${plan.id}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50 group"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {plan.inputText}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={statusVariant(plan.status)} className="capitalize text-xs">
                          {statusLabel(plan.status)}
                        </Badge>
                        <span className={`font-medium ${riskColor(plan.riskLevel)}`}>
                          {plan.riskLevel} risk
                        </span>
                        <span>{formatDate(plan.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(page - 1)}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page numbers — show up to 5 around current */}
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter((i) => Math.abs(i - page) <= 2)
                .map((i) => (
                  <Button
                    key={i}
                    variant={i === page ? "secondary" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => load(i)}
                    disabled={isLoading}
                  >
                    {i + 1}
                  </Button>
                ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => load(page + 1)}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
