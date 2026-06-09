"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  actionPlansApi,
  planActionsApi,
  type ActionPlanDetail,
  type ActionPlanActionDto,
  type ActionRequest,
  type ActionType,
  type IntegrationProvider,
  type RiskLevel,
  type ExecutionEngineType,
  type ActionPlanStatus,
} from "@/lib/api";

const ACTION_TYPES: ActionType[] = [
  "CREATE_TASK",
  "UPDATE_TASK",
  "CREATE_CALENDAR_EVENT",
  "RESCHEDULE_CALENDAR_EVENT",
  "DRAFT_EMAIL",
  "SEND_EMAIL",
  "READ_EMAIL",
  "TRIGGER_WORKFLOW",
  "LOG_CRM_ACTIVITY",
  "UPDATE_DEAL_STATUS",
];

const PROVIDERS: IntegrationProvider[] = [
  "GOOGLE_CALENDAR",
  "GMAIL",
  "OUTLOOK_CALENDAR",
  "OUTLOOK_MAIL",
  "HUBSPOT",
  "SLACK",
  "NOTION",
  "FACEBOOK",
  "INSTAGRAM",
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "INTERNAL_TASKS",
];

const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
const ENGINE_OVERRIDES: Array<ExecutionEngineType | "__none__"> = ["__none__", "N8N", "DIRECT", "HYBRID"];

interface ActionFormState {
  actionType: ActionType | "";
  provider: IntegrationProvider | "";
  riskLevel: RiskLevel | "";
  engineOverride: ExecutionEngineType | "__none__";
  payloadJson: string;
}

const emptyForm: ActionFormState = {
  actionType: "",
  provider: "",
  riskLevel: "",
  engineOverride: "__none__",
  payloadJson: "{}",
};

function statusLabel(status: ActionPlanStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusVariant(status: ActionPlanStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DRAFT": return "secondary";
    case "CONFIRMED": return "outline";
    case "EXECUTING": return "outline";
    case "SUCCESS": return "default";
    case "FAILED": return "destructive";
    case "CANCELLED": return "secondary";
  }
}

function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case "LOW": return "text-green-600 dark:text-green-400";
    case "MEDIUM": return "text-amber-600 dark:text-amber-400";
    case "HIGH": return "text-red-600 dark:text-red-400";
  }
}

function humanize(str: string): string {
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const planId = params.planId;
  const { user, initialized } = useAuth();

  const [plan, setPlan] = useState<ActionPlanDetail | null>(null);
  const [actions, setActions] = useState<ActionPlanActionDto[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [actionsError, setActionsError] = useState<string | null>(null);

  // 409 conflict banner
  const [conflictBanner, setConflictBanner] = useState(false);

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionPlanActionDto | null>(null);
  const [form, setForm] = useState<ActionFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<ActionPlanActionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.push("/login");
  }, [user, initialized, router]);

  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const data = await actionPlansApi.get(planId);
      setPlan(data);
    } catch {
      setPlanError("Failed to load plan details.");
    } finally {
      setPlanLoading(false);
    }
  }, [planId]);

  const loadActions = useCallback(async () => {
    setActionsLoading(true);
    setActionsError(null);
    try {
      const data = await planActionsApi.list(planId);
      setActions(data.content);
    } catch {
      setActionsError("Failed to load actions.");
    } finally {
      setActionsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (initialized && user) {
      loadPlan();
      loadActions();
    }
  }, [initialized, user, loadPlan, loadActions]);

  if (!initialized || !user) return null;

  const isDraft = plan?.status === "DRAFT";

  function openAddDialog() {
    setEditingAction(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(action: ActionPlanActionDto) {
    setEditingAction(action);
    setForm({
      actionType: action.actionType,
      provider: action.provider,
      riskLevel: action.riskLevel,
      engineOverride: action.engineOverride ?? "__none__",
      payloadJson: JSON.stringify(action.payload, null, 2),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function buildRequest(): ActionRequest | null {
    if (!form.actionType || !form.provider || !form.riskLevel) return null;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(form.payloadJson);
    } catch {
      setFormError("Payload must be valid JSON.");
      return null;
    }
    const req: ActionRequest = {
      actionType: form.actionType as ActionType,
      provider: form.provider as IntegrationProvider,
      riskLevel: form.riskLevel as RiskLevel,
      payload,
    };
    if (form.engineOverride && form.engineOverride !== "__none__") {
      req.engineOverride = form.engineOverride as ExecutionEngineType;
    }
    return req;
  }

  async function handleSave() {
    const req = buildRequest();
    if (!req) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingAction) {
        const updated = await planActionsApi.update(planId, editingAction.actionIndex, req);
        setActions((prev) =>
          prev.map((a) => (a.actionIndex === editingAction.actionIndex ? updated : a))
        );
      } else {
        const created = await planActionsApi.create(planId, req);
        setActions((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "CONFLICT") {
        setDialogOpen(false);
        setConflictBanner(true);
      } else if (e?.code === "VALIDATION") {
        setFormError("Please check your inputs and try again.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await planActionsApi.delete(planId, deleteTarget.actionIndex);
      setActions((prev) => prev.filter((a) => a.actionIndex !== deleteTarget.actionIndex));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "CONFLICT") {
        setDeleteTarget(null);
        setConflictBanner(true);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/my-action-plans" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            My Action Plans
          </Link>
        </div>

        {/* Conflict banner */}
        {conflictBanner && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This plan can no longer be edited.
            </div>
            <button
              type="button"
              onClick={() => setConflictBanner(false)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Plan info */}
        {planLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : planError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{planError}</p>
            <Button variant="outline" size="sm" onClick={loadPlan}>Retry</Button>
          </div>
        ) : plan ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
                <span className={`text-sm font-medium ${riskColor(plan.riskLevel)}`}>
                  {plan.riskLevel} risk
                </span>
              </div>
              <CardTitle className="text-base font-normal text-muted-foreground mt-2 leading-relaxed">
                {/* plan.inputText not on ActionPlanDetail — show plan id as fallback */}
                Plan ID: {plan.actionPlanId}
              </CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {/* Actions section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Actions</CardTitle>
              {isDraft && (
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add action
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : actionsError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{actionsError}</p>
                <Button variant="outline" size="sm" onClick={loadActions}>Retry</Button>
              </div>
            ) : actions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-muted-foreground">No actions yet.</p>
                {isDraft && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add first action
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          #{action.actionIndex + 1} — {humanize(action.actionType)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {humanize(action.provider)}
                        </Badge>
                        <span className={`text-xs font-medium ${riskColor(action.riskLevel)}`}>
                          {action.riskLevel}
                        </span>
                        {action.engineOverride && (
                          <Badge variant="secondary" className="text-xs">
                            {action.engineOverride}
                          </Badge>
                        )}
                      </div>
                      {Object.keys(action.payload).length > 0 && (
                        <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto max-h-24">
                          {JSON.stringify(action.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                    {isDraft && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(action)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(action)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit action dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAction ? "Edit Action" : "Add Action"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action type</Label>
                <Select
                  value={form.actionType}
                  onValueChange={(v) => setForm((f) => ({ ...f, actionType: v as ActionType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{humanize(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={form.provider}
                  onValueChange={(v) => setForm((f) => ({ ...f, provider: v as IntegrationProvider }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{humanize(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Risk level</Label>
                <Select
                  value={form.riskLevel}
                  onValueChange={(v) => setForm((f) => ({ ...f, riskLevel: v as RiskLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Engine override <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Select
                  value={form.engineOverride}
                  onValueChange={(v) => setForm((f) => ({ ...f, engineOverride: v as ExecutionEngineType | "__none__" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGINE_OVERRIDES.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e === "__none__" ? "Default" : e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payload <span className="text-muted-foreground text-xs">(JSON)</span></Label>
              <Textarea
                rows={6}
                value={form.payloadJson}
                onChange={(e) => setForm((f) => ({ ...f, payloadJson: e.target.value }))}
                className="font-mono text-xs"
                placeholder="{}"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.actionType || !form.provider || !form.riskLevel || saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAction ? "Save changes" : "Add action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete action?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove action #{deleteTarget ? deleteTarget.actionIndex + 1 : ""} from the plan.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
