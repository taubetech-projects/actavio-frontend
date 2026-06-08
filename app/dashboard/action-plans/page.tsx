"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  Clock,
  RotateCcw,
  ListTodo,
  Edit,
  Calendar,
  CalendarClock,
  Mail,
  Zap,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  actionPlansApi,
  type ActionPlanDetail,
  type ActionPlanSummary,
  type ActionType,
  type RiskLevel,
  type ActionPlanStatus,
} from "@/lib/api";

// ── Metadata maps ─────────────────────────────────────────────────────────────

const ACTION_META: Record<ActionType, { label: string; icon: React.ElementType }> = {
  CREATE_TASK:                 { label: "Create task",                  icon: ListTodo },
  UPDATE_TASK:                 { label: "Update task",                  icon: Edit },
  CREATE_CALENDAR_EVENT:       { label: "Create calendar event",        icon: Calendar },
  RESCHEDULE_CALENDAR_EVENT:   { label: "Reschedule calendar event",    icon: CalendarClock },
  DRAFT_EMAIL:                 { label: "Draft email",                  icon: Mail },
  SEND_EMAIL:                  { label: "Send email",                   icon: Send },
  TRIGGER_WORKFLOW:            { label: "Trigger workflow",             icon: Zap },
  LOG_CRM_ACTIVITY:            { label: "Log CRM activity",             icon: BarChart2 },
  UPDATE_DEAL_STATUS:          { label: "Update deal status",           icon: TrendingUp },
};

const RISK_STYLE: Record<RiskLevel, { badge: string; label: string }> = {
  LOW:    { badge: "bg-success/10 text-success",          label: "Low risk" },
  MEDIUM: { badge: "bg-yellow-500/10 text-yellow-600",    label: "Medium risk" },
  HIGH:   { badge: "bg-destructive/10 text-destructive",  label: "High risk" },
};

const STATUS_STYLE: Record<ActionPlanStatus, { icon: React.ElementType; className: string; label: string }> = {
  DRAFT:      { icon: Clock,         className: "text-muted-foreground", label: "Draft" },
  CONFIRMED:  { icon: Clock,         className: "text-blue-500",         label: "Confirmed" },
  EXECUTING:  { icon: Loader2,       className: "text-yellow-500",       label: "Executing" },
  SUCCESS:    { icon: CheckCircle2,  className: "text-success",          label: "Success" },
  FAILED:     { icon: XCircle,       className: "text-destructive",      label: "Failed" },
  CANCELLED:  { icon: XCircle,       className: "text-muted-foreground", label: "Cancelled" },
};

// ── Phase type ────────────────────────────────────────────────────────────────

type Phase =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "draft"; plan: ActionPlanDetail }
  | { kind: "executing"; planId: string }
  | { kind: "result"; plan: ActionPlanDetail }
  | { kind: "error"; message: string };

// ── Payload summary ───────────────────────────────────────────────────────────

function payloadSummary(type: ActionType, payload: Record<string, unknown>): string {
  const p = payload as Record<string, string>;
  switch (type) {
    case "SEND_EMAIL":
    case "DRAFT_EMAIL":
      return [p.to && `To: ${p.to}`, p.subject && `"${p.subject}"`].filter(Boolean).join(" · ");
    case "CREATE_TASK":
    case "UPDATE_TASK":
      return p.title ? `"${p.title}"` : "";
    case "CREATE_CALENDAR_EVENT":
    case "RESCHEDULE_CALENDAR_EVENT":
      return [p.title && `"${p.title}"`, p.startTime && new Date(p.startTime).toLocaleString()].filter(Boolean).join(" · ");
    default:
      return "";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const s = RISK_STYLE[level];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}>
      {s.label}
    </span>
  );
}

function ActionCard({ action }: { action: ActionPlanDetail["actions"][number] }) {
  const meta = ACTION_META[action.type];
  const Icon = meta.icon;
  const summary = payloadSummary(action.type, action.payload);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground text-sm">{meta.label}</span>
          <RiskBadge level={action.riskLevel} />
        </div>
        {summary && <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>}
        <p className="text-xs text-muted-foreground/60 mt-0.5">{action.provider.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
}

function ExplainSection({ explain }: { explain: ActionPlanDetail["explain"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Why this?
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          explain.confidence === "HIGH"   ? "bg-success/10 text-success" :
          explain.confidence === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                                            "bg-destructive/10 text-destructive"
        }`}>
          {explain.confidence} confidence
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          {explain.triggers.length > 0 && (
            <div>
              <p className="font-medium text-foreground mb-2">Detected phrases</p>
              <div className="flex flex-wrap gap-2">
                {explain.triggers.map((t, i) => (
                  <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {t.phrase} → {t.maps_to?.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {explain.defaults.length > 0 && (
            <div>
              <p className="font-medium text-foreground mb-2">Defaults applied</p>
              <ul className="space-y-1 text-muted-foreground">
                {explain.defaults.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                    {d.field}: {d.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explain.willNot.length > 0 && (
            <div>
              <p className="font-medium text-foreground mb-2">Will NOT do</p>
              <ul className="space-y-1 text-muted-foreground">
                {explain.willNot.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ plan }: { plan: ActionPlanSummary }) {
  const s = STATUS_STYLE[plan.status];
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors">
      <Icon className={`h-4 w-4 shrink-0 ${s.className} ${plan.status === "EXECUTING" ? "animate-spin" : ""}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{plan.inputText}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          {" · "}
          <span className={s.className}>{s.label}</span>
          {" · "}
          <RiskBadge level={plan.riskLevel} />
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ActionPlansPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [instruction, setInstruction] = useState("");
  const [history, setHistory] = useState<ActionPlanSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // HIGH risk confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; plan: ActionPlanDetail | null }>({ open: false, plan: null });
  const [confirmText, setConfirmText] = useState("");

  // MEDIUM risk confirm dialog
  const [mediumDialog, setMediumDialog] = useState<{ open: boolean; plan: ActionPlanDetail | null }>({ open: false, plan: null });

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.push("/login");
  }, [user, initialized, router]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await actionPlansApi.list();
      setHistory(data);
    } catch {
      // non-fatal
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user) loadHistory();
  }, [initialized, user, loadHistory]);

  // Polling loop when executing
  useEffect(() => {
    if (phase.kind !== "executing") return;
    const planId = phase.planId;

    async function poll() {
      try {
        const detail = await actionPlansApi.get(planId);
        if (detail.status === "SUCCESS" || detail.status === "FAILED" || detail.status === "CANCELLED") {
          setPhase({ kind: "result", plan: detail });
          loadHistory();
        } else {
          pollingRef.current = setTimeout(poll, 2500);
        }
      } catch {
        pollingRef.current = setTimeout(poll, 4000);
      }
    }

    pollingRef.current = setTimeout(poll, 2500);
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [phase, loadHistory]);

  if (!initialized || !user) return null;

  // ── Handlers ──

  async function handlePreview() {
    if (!instruction.trim()) return;
    setPhase({ kind: "previewing" });
    try {
      const plan = await actionPlansApi.preview(instruction.trim());
      setPhase({ kind: "draft", plan });
    } catch (err: unknown) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Preview failed." });
    }
  }

  async function executeConfirm(plan: ActionPlanDetail) {
    setPhase({ kind: "executing", planId: plan.actionPlanId });
    try {
      await actionPlansApi.confirm(plan.actionPlanId);
    } catch (err: unknown) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Confirm failed." });
    }
  }

  function handleConfirm(plan: ActionPlanDetail) {
    if (plan.riskLevel === "HIGH") {
      setConfirmText("");
      setConfirmDialog({ open: true, plan });
    } else if (plan.riskLevel === "MEDIUM") {
      setMediumDialog({ open: true, plan });
    } else {
      executeConfirm(plan);
    }
  }

  function reset() {
    setInstruction("");
    setPhase({ kind: "idle" });
  }

  // ── Render ──

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            Describe what you want to do in plain language. The AI will plan the steps and ask for your approval.
          </p>
        </div>

        {/* Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              placeholder={`e.g. "Send a follow-up email to John about the Q3 proposal and schedule a 30-minute call next Tuesday at 2pm"`}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="min-h-[100px] resize-none text-base"
              disabled={phase.kind === "previewing" || phase.kind === "executing"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePreview();
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">⌘ Enter to submit</p>
              <div className="flex gap-2">
                {phase.kind !== "idle" && phase.kind !== "previewing" && (
                  <Button variant="outline" onClick={reset} size="sm">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Start over
                  </Button>
                )}
                <Button
                  onClick={handlePreview}
                  disabled={!instruction.trim() || phase.kind === "previewing" || phase.kind === "executing"}
                >
                  {phase.kind === "previewing" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Preview plan</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase-dependent middle section */}

        {phase.kind === "draft" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Proposed plan</CardTitle>
                <RiskBadge level={phase.plan.riskLevel} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Actions */}
              <div className="space-y-2">
                {phase.plan.actions.map((action) => (
                  <ActionCard key={action.index} action={action} />
                ))}
              </div>

              {/* Explain */}
              <ExplainSection explain={phase.plan.explain} />

              {/* Risk warning for HIGH */}
              {phase.plan.riskLevel === "HIGH" && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This plan contains high-risk actions. You will need to type CONFIRM to proceed.</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => handleConfirm(phase.plan)} className="flex-1">
                  {phase.plan.riskLevel === "HIGH" ? "Review & Confirm" :
                   phase.plan.riskLevel === "MEDIUM" ? "Confirm plan" :
                   "Confirm & execute"}
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {phase.kind === "executing" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-muted" />
                  <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Executing plan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Actions are running. This may take a moment…
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {phase.kind === "result" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                {phase.plan.status === "SUCCESS" ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-success" />
                    <p className="text-lg font-semibold text-foreground">Plan executed successfully</p>
                    <p className="text-sm text-muted-foreground">All actions completed.</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-destructive" />
                    <p className="text-lg font-semibold text-foreground">
                      {phase.plan.status === "CANCELLED" ? "Plan cancelled" : "Plan failed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {phase.plan.status === "CANCELLED"
                        ? "The plan was cancelled before completion."
                        : "One or more actions could not be completed."}
                    </p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {phase.plan.actions.map((action) => (
                  <ActionCard key={action.index} action={action} />
                ))}
              </div>
              <Button className="w-full" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start a new instruction
              </Button>
            </CardContent>
          </Card>
        )}

        {phase.kind === "error" && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-sm mt-0.5 text-destructive/80">{phase.message}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={reset}>Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Recent plans</h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No plans yet. Submit an instruction above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((plan) => (
                <HistoryRow key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MEDIUM risk confirmation dialog */}
      <Dialog
        open={mediumDialog.open}
        onOpenChange={(open) => setMediumDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm medium-risk plan
            </DialogTitle>
            <DialogDescription>
              This plan contains medium-risk actions. Please review before proceeding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediumDialog({ open: false, plan: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const plan = mediumDialog.plan;
                setMediumDialog({ open: false, plan: null });
                if (plan) executeConfirm(plan);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HIGH risk confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          setConfirmDialog((d) => ({ ...d, open }));
          if (!open) setConfirmText("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              High-risk confirmation required
            </DialogTitle>
            <DialogDescription>
              Type <strong>CONFIRM</strong> below to execute this high-risk plan.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CONFIRM"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog({ open: false, plan: null });
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={confirmText !== "CONFIRM"}
              onClick={() => {
                const plan = confirmDialog.plan;
                setConfirmDialog({ open: false, plan: null });
                setConfirmText("");
                if (plan) executeConfirm(plan);
              }}
            >
              Execute plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
