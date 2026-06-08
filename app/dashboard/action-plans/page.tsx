"use client";

import { useState, useEffect, useCallback } from "react";
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
  Inbox,
  Zap,
  BarChart2,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  actionPlansApi,
  type ActionPlanDetail,
  type ActionPlanSummary,
  type ActionType,
  type RiskLevel,
  type ActionPlanStatus,
  type ActionExecutionResult,
  type ConfirmResponse,
  type ReadEmailRaw,
  type CreateCalendarEventRaw,
  type RescheduleCalendarEventRaw,
} from "@/lib/api";

// ── Metadata maps ─────────────────────────────────────────────────────────────

const ACTION_META: Record<ActionType, { label: string; icon: React.ElementType }> = {
  CREATE_TASK:               { label: "Create task",               icon: ListTodo },
  UPDATE_TASK:               { label: "Update task",               icon: Edit },
  CREATE_CALENDAR_EVENT:     { label: "Create calendar event",     icon: Calendar },
  RESCHEDULE_CALENDAR_EVENT: { label: "Reschedule calendar event", icon: CalendarClock },
  DRAFT_EMAIL:               { label: "Draft email",               icon: Mail },
  SEND_EMAIL:                { label: "Send email",                icon: Send },
  READ_EMAIL:                { label: "Read emails",               icon: Inbox },
  TRIGGER_WORKFLOW:          { label: "Trigger workflow",          icon: Zap },
  LOG_CRM_ACTIVITY:          { label: "Log CRM activity",          icon: BarChart2 },
  UPDATE_DEAL_STATUS:        { label: "Update deal status",        icon: TrendingUp },
};

const RISK_STYLE: Record<RiskLevel, { badge: string; label: string }> = {
  LOW:    { badge: "bg-success/10 text-success",         label: "Low risk" },
  MEDIUM: { badge: "bg-yellow-500/10 text-yellow-600",   label: "Medium risk" },
  HIGH:   { badge: "bg-destructive/10 text-destructive", label: "High risk" },
};

const STATUS_STYLE: Record<ActionPlanStatus, { icon: React.ElementType; className: string; label: string }> = {
  DRAFT:     { icon: Clock,        className: "text-muted-foreground", label: "Draft" },
  CONFIRMED: { icon: Clock,        className: "text-blue-500",         label: "Confirmed" },
  EXECUTING: { icon: Loader2,      className: "text-yellow-500",       label: "Executing" },
  SUCCESS:   { icon: CheckCircle2, className: "text-success",          label: "Success" },
  FAILED:    { icon: XCircle,      className: "text-destructive",      label: "Failed" },
  CANCELLED: { icon: XCircle,      className: "text-muted-foreground", label: "Cancelled" },
};

const READ_EMAIL_SUGGESTIONS: Array<{ label: string; value: string }> = [
  { label: "Unread inbox", value: "in:inbox is:unread" },
  { label: "All inbox",    value: "in:inbox" },
  { label: "Sent mail",    value: "in:sent" },
  { label: "Last 7 days",  value: "newer_than:7d" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "draft"; plan: ActionPlanDetail }
  | { kind: "confirming" }
  | { kind: "result"; plan: ActionPlanDetail; result: ConfirmResponse }
  | { kind: "error"; message: string };

// Mutable payload fields tracked per action index.
type PayloadEdits = Partial<Record<number, Record<string, string>>>;

// Field-level validation errors per action index.
type ValidationErrors = Partial<Record<number, Record<string, string>>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isValidDatetime(value: string): boolean {
  if (!value.trim()) return false;
  return !isNaN(new Date(value).getTime());
}

// Converts an ISO-8601 string to the `datetime-local` input format (YYYY-MM-DDTHH:mm).
function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function initPayloadEdits(plan: ActionPlanDetail): PayloadEdits {
  const edits: PayloadEdits = {};
  for (const action of plan.actions) {
    const p = action.payload as Record<string, string | number>;

    if (action.provider === "GMAIL") {
      if (action.type === "DRAFT_EMAIL" || action.type === "SEND_EMAIL") {
        edits[action.index] = {
          to:      String(p.to      ?? ""),
          subject: String(p.subject ?? ""),
          body:    String(p.body    ?? ""),
          cc:      String(p.cc      ?? ""),
          bcc:     String(p.bcc     ?? ""),
        };
      } else if (action.type === "READ_EMAIL") {
        edits[action.index] = {
          query:      String(p.query      ?? "in:inbox is:unread"),
          maxResults: String(p.maxResults ?? "5"),
        };
      }
    }

    if (action.provider === "GOOGLE_CALENDAR") {
      if (action.type === "CREATE_CALENDAR_EVENT") {
        edits[action.index] = {
          title:         String(p.title         ?? ""),
          startDateTime: toDatetimeLocal(String(p.startDateTime ?? "")),
          endDateTime:   toDatetimeLocal(String(p.endDateTime   ?? "")),
          description:   String(p.description   ?? ""),
          location:      String(p.location      ?? ""),
        };
      } else if (action.type === "RESCHEDULE_CALENDAR_EVENT") {
        edits[action.index] = {
          searchQuery:           String(p.searchQuery           ?? ""),
          originalStartDateTime: toDatetimeLocal(String(p.originalStartDateTime ?? p.startDateTime ?? "")),
          startDateTime:         toDatetimeLocal(String(p.startDateTime         ?? "")),
          endDateTime:           toDatetimeLocal(String(p.endDateTime           ?? "")),
        };
      }
    }
  }
  return edits;
}

// Per-action field-level validation. Returns an empty object when the plan is ready to confirm.
function validatePayloadEdits(plan: ActionPlanDetail, edits: PayloadEdits): ValidationErrors {
  const result: ValidationErrors = {};

  for (const action of plan.actions) {
    const f = edits[action.index] ?? {};
    const e: Record<string, string> = {};

    if (action.type === "SEND_EMAIL") {
      const to = f.to?.trim() ?? "";
      if (!to) {
        e.to = "Recipient is required.";
      } else if (!EMAIL_REGEX.test(to)) {
        e.to = "Enter a valid email address.";
      }
    }

    if (action.type === "CREATE_CALENDAR_EVENT") {
      if (!f.startDateTime?.trim()) {
        e.startDateTime = "Start time is required.";
      } else if (!isValidDatetime(f.startDateTime)) {
        e.startDateTime = "Enter a valid date and time.";
      }
      if (!f.endDateTime?.trim()) {
        e.endDateTime = "End time is required.";
      } else if (!isValidDatetime(f.endDateTime)) {
        e.endDateTime = "Enter a valid date and time.";
      }
    }

    if (action.type === "RESCHEDULE_CALENDAR_EVENT") {
      if (!f.searchQuery?.trim()) {
        e.searchQuery = "Event description is required to locate the event.";
      }
      if (!f.startDateTime?.trim()) {
        e.startDateTime = "New start time is required.";
      } else if (!isValidDatetime(f.startDateTime)) {
        e.startDateTime = "Enter a valid date and time.";
      }
      if (!f.endDateTime?.trim()) {
        e.endDateTime = "New end time is required.";
      } else if (!isValidDatetime(f.endDateTime)) {
        e.endDateTime = "Enter a valid date and time.";
      }
    }

    if (Object.keys(e).length > 0) result[action.index] = e;
  }

  return result;
}

function confirmButtonLabel(plan: ActionPlanDetail): string {
  if (plan.actions.length === 1) {
    switch (plan.actions[0].type) {
      case "DRAFT_EMAIL":               return "Create Draft";
      case "SEND_EMAIL":                return "Send Email";
      case "READ_EMAIL":                return "Fetch Emails";
      case "CREATE_CALENDAR_EVENT":     return "Create Event";
      case "RESCHEDULE_CALENDAR_EVENT": return "Reschedule Event";
    }
  }
  if (plan.riskLevel === "HIGH")   return "Review & Confirm";
  if (plan.riskLevel === "MEDIUM") return "Confirm plan";
  return "Confirm & execute";
}

// ── Payload summary (read-only, for non-editable action types) ────────────────

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

// Read-only card for non-editable action types and the result phase.
function ActionCard({ action }: { action: ActionPlanDetail["actions"][number] }) {
  const meta = ACTION_META[action.type];
  const Icon = meta?.icon;
  const summary = payloadSummary(action.type, action.payload);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground text-sm">{meta?.label}</span>
          <RiskBadge level={action.riskLevel} />
        </div>
        {summary && <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>}
        <p className="text-xs text-muted-foreground/60 mt-0.5">{action.provider.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
}

// Editable Gmail payload form.
function GmailPayloadEditor({
  action,
  edits,
  errors,
  onChange,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  if (action.type === "DRAFT_EMAIL") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            value={edits.to ?? ""}
            onChange={e => onChange("to", e.target.value)}
            placeholder="(fill in Gmail before sending)"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Subject</Label>
          <Input
            value={edits.subject ?? ""}
            onChange={e => onChange("subject", e.target.value)}
            placeholder="Subject"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Body</Label>
          <Textarea
            value={edits.body ?? ""}
            onChange={e => onChange("body", e.target.value)}
            placeholder="Email body…"
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }

  if (action.type === "SEND_EMAIL") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            To <span className="text-destructive">*</span>
          </Label>
          <Input
            value={edits.to ?? ""}
            onChange={e => onChange("to", e.target.value)}
            placeholder="recipient@example.com"
            className={`h-8 text-sm ${errors.to ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {errors.to && <p className="text-xs text-destructive">{errors.to}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">CC</Label>
            <Input value={edits.cc ?? ""} onChange={e => onChange("cc", e.target.value)} placeholder="Optional" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">BCC</Label>
            <Input value={edits.bcc ?? ""} onChange={e => onChange("bcc", e.target.value)} placeholder="Optional" className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Subject</Label>
          <Input value={edits.subject ?? ""} onChange={e => onChange("subject", e.target.value)} placeholder="Subject" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Body</Label>
          <Textarea value={edits.body ?? ""} onChange={e => onChange("body", e.target.value)} placeholder="Email body…" className="min-h-[80px] text-sm resize-none" />
        </div>
      </div>
    );
  }

  if (action.type === "READ_EMAIL") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Search query</Label>
          <Input
            value={edits.query ?? ""}
            onChange={e => onChange("query", e.target.value)}
            placeholder="in:inbox is:unread"
            className="h-8 text-sm font-mono"
          />
          <div className="flex flex-wrap gap-1.5">
            {READ_EMAIL_SUGGESTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange("query", s.value)}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max results (1–20)</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={edits.maxResults ?? "5"}
            onChange={e => onChange("maxResults", e.target.value)}
            className="h-8 text-sm w-24"
          />
        </div>
      </div>
    );
  }

  return null;
}

// Editable Google Calendar payload form.
function CalendarPayloadEditor({
  action,
  edits,
  errors,
  onChange,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  if (action.type === "CREATE_CALENDAR_EVENT") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input value={edits.title ?? ""} onChange={e => onChange("title", e.target.value)} placeholder="Meeting title" className="h-8 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Start <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={edits.startDateTime ?? ""}
              onChange={e => onChange("startDateTime", e.target.value)}
              className={`h-8 text-sm ${errors.startDateTime ? "border-destructive" : ""}`}
            />
            {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              End <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={edits.endDateTime ?? ""}
              onChange={e => onChange("endDateTime", e.target.value)}
              className={`h-8 text-sm ${errors.endDateTime ? "border-destructive" : ""}`}
            />
            {errors.endDateTime && <p className="text-xs text-destructive">{errors.endDateTime}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea value={edits.description ?? ""} onChange={e => onChange("description", e.target.value)} placeholder="Optional" className="min-h-[60px] text-sm resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Input value={edits.location ?? ""} onChange={e => onChange("location", e.target.value)} placeholder="Optional" className="h-8 text-sm" />
        </div>
      </div>
    );
  }

  if (action.type === "RESCHEDULE_CALENDAR_EVENT") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Event to reschedule <span className="text-destructive">*</span>
          </Label>
          <Input
            value={edits.searchQuery ?? ""}
            onChange={e => onChange("searchQuery", e.target.value)}
            placeholder="Event title or keywords"
            className={`h-8 text-sm ${errors.searchQuery ? "border-destructive" : ""}`}
          />
          {errors.searchQuery && <p className="text-xs text-destructive">{errors.searchQuery}</p>}
        </div>
        {edits.originalStartDateTime && (
          <p className="text-xs text-muted-foreground">
            Current time (AI detected): {new Date(edits.originalStartDateTime).toLocaleString()}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              New start <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={edits.startDateTime ?? ""}
              onChange={e => onChange("startDateTime", e.target.value)}
              className={`h-8 text-sm ${errors.startDateTime ? "border-destructive" : ""}`}
            />
            {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              New end <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={edits.endDateTime ?? ""}
              onChange={e => onChange("endDateTime", e.target.value)}
              className={`h-8 text-sm ${errors.endDateTime ? "border-destructive" : ""}`}
            />
            {errors.endDateTime && <p className="text-xs text-destructive">{errors.endDateTime}</p>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Expanded card with editable payload for Gmail and Calendar actions.
function EditableActionCard({
  action,
  edits,
  errors,
  onFieldChange,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  onFieldChange: (actionIndex: number, field: string, value: string) => void;
}) {
  const isEditable = action.provider === "GMAIL" || action.provider === "GOOGLE_CALENDAR";
  if (!isEditable) return <ActionCard action={action} />;

  const meta = ACTION_META[action.type];
  const Icon = meta?.icon;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-3.5 w-3.5 text-foreground" />
          </div>
          <span className="font-medium text-sm text-foreground">{meta?.label}</span>
        </div>
        <RiskBadge level={action.riskLevel} />
      </div>
      {action.provider === "GMAIL" && (
        <GmailPayloadEditor
          action={action}
          edits={edits}
          errors={errors}
          onChange={(field, value) => onFieldChange(action.index, field, value)}
        />
      )}
      {action.provider === "GOOGLE_CALENDAR" && (
        <CalendarPayloadEditor
          action={action}
          edits={edits}
          errors={errors}
          onChange={(field, value) => onFieldChange(action.index, field, value)}
        />
      )}
    </div>
  );
}

// Per-action result card shown in the result phase.
function ActionResultCard({
  action,
  result,
  onGoToSettings,
}: {
  action: ActionPlanDetail["actions"][number];
  result: ActionExecutionResult;
  onGoToSettings: () => void;
}) {
  const meta = ACTION_META[action.type];
  const Icon = meta?.icon;
  const ok = result.status === "SUCCESS";
  const credentialError = result.errorCode === "NO_CREDENTIALS" || result.errorCode === "TOKEN_EXPIRED";

  return (
    <div className="rounded-lg border border-border p-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-3.5 w-3.5 text-foreground" />
          </div>
          <span className="font-medium text-sm text-foreground">{meta?.label}</span>
        </div>
        {ok ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        )}
      </div>

      {/* Success content */}
      {ok && (
        <>
          {action.type === "DRAFT_EMAIL" && (
            <a href="https://mail.google.com/mail/#drafts" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Drafts in Gmail
            </a>
          )}

          {action.type === "SEND_EMAIL" && (
            <a href="https://mail.google.com/mail/#sent" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              View Sent Mail
            </a>
          )}

          {action.type === "READ_EMAIL" && result.raw && (() => {
            const raw = result.raw as unknown as ReadEmailRaw;
            return (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {raw.count} email{raw.count !== 1 ? "s" : ""} fetched
                </p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {raw.messages.map(msg => (
                    <div key={msg.id} className="rounded border border-border p-2.5">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate">
                          {msg.subject || "(no subject)"}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">{msg.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.from}</p>
                      {msg.snippet && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{msg.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {action.type === "CREATE_CALENDAR_EVENT" && result.raw && (() => {
            const raw = result.raw as unknown as CreateCalendarEventRaw;
            return (
              <a href={raw.htmlLink} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Google Calendar
              </a>
            );
          })()}

          {action.type === "RESCHEDULE_CALENDAR_EVENT" && result.raw && (() => {
            const raw = result.raw as unknown as RescheduleCalendarEventRaw;
            return (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Rescheduled: {raw.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(raw.oldStartDateTime).toLocaleString()}
                  {" → "}
                  {new Date(raw.newStartDateTime).toLocaleString()}
                </p>
                <a href={raw.htmlLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Google Calendar
                </a>
              </div>
            );
          })()}
        </>
      )}

      {/* Failed content */}
      {!ok && (
        <div className="space-y-2">
          {result.messageUser && (
            <p className="text-sm text-destructive">{result.messageUser}</p>
          )}

          {result.errorCode === "EVENT_NOT_FOUND" && (
            <p className="text-xs text-muted-foreground">
              We couldn&apos;t find the event. Check Google Calendar and try again with a more specific description.
            </p>
          )}

          {credentialError && (
            <Button variant="outline" size="sm" onClick={onGoToSettings} className="text-xs h-7">
              {action.provider === "GMAIL" ? "Reconnect Gmail" : "Reconnect Google Calendar"}
            </Button>
          )}
        </div>
      )}
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
  const [payloadEdits, setPayloadEdits] = useState<PayloadEdits>({});
  const [instruction, setInstruction] = useState("");
  const [history, setHistory] = useState<ActionPlanSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; plan: ActionPlanDetail | null }>({ open: false, plan: null });
  const [confirmText, setConfirmText] = useState("");
  const [mediumDialog, setMediumDialog] = useState<{ open: boolean; plan: ActionPlanDetail | null }>({ open: false, plan: null });

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

  if (!initialized || !user) return null;

  // ── Derived draft-phase values ──

  const draftPlan = phase.kind === "draft" ? phase.plan : null;
  const draftValidationErrors: ValidationErrors = draftPlan
    ? validatePayloadEdits(draftPlan, payloadEdits)
    : {};
  const draftHasErrors = Object.keys(draftValidationErrors).length > 0;
  const draftHasSendEmail = draftPlan ? draftPlan.actions.some(a => a.type === "SEND_EMAIL") : false;

  // ── Handlers ──

  async function handlePreview() {
    if (!instruction.trim()) return;
    setPhase({ kind: "previewing" });
    try {
      const plan = await actionPlansApi.preview(instruction.trim());
      setPhase({ kind: "draft", plan });
      setPayloadEdits(initPayloadEdits(plan));
    } catch (err: unknown) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Preview failed." });
    }
  }

  function setPayloadField(actionIndex: number, field: string, value: string) {
    setPayloadEdits(prev => ({
      ...prev,
      [actionIndex]: { ...(prev[actionIndex] ?? {}), [field]: value },
    }));
  }

  async function executeConfirm(plan: ActionPlanDetail) {
    setPhase({ kind: "confirming" });
    try {
      const result = await actionPlansApi.confirm(plan.actionPlanId);
      setPhase({ kind: "result", plan, result });
      loadHistory();
    } catch (err: unknown) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Confirm failed." });
    }
  }

  function handleConfirm(plan: ActionPlanDetail) {
    if (Object.keys(validatePayloadEdits(plan, payloadEdits)).length > 0) return;
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
    setPayloadEdits({});
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
              disabled={phase.kind === "previewing" || phase.kind === "confirming"}
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
                  disabled={!instruction.trim() || phase.kind === "previewing" || phase.kind === "confirming"}
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

        {/* Draft phase */}
        {phase.kind === "draft" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Proposed plan</CardTitle>
                <RiskBadge level={phase.plan.riskLevel} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {phase.plan.actions.map((action) => (
                  <EditableActionCard
                    key={action.index}
                    action={action}
                    edits={payloadEdits[action.index] ?? {}}
                    errors={draftValidationErrors[action.index] ?? {}}
                    onFieldChange={setPayloadField}
                  />
                ))}
              </div>

              <ExplainSection explain={phase.plan.explain} />

              {draftHasSendEmail && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This will send the email immediately and cannot be undone.</span>
                </div>
              )}

              {!draftHasSendEmail && phase.plan.riskLevel === "HIGH" && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This plan contains high-risk actions. You will need to type CONFIRM to proceed.</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleConfirm(phase.plan)}
                  disabled={draftHasErrors}
                  className="flex-1"
                >
                  {confirmButtonLabel(phase.plan)}
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirming phase */}
        {phase.kind === "confirming" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-muted" />
                  <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Executing plan</p>
                  <p className="text-sm text-muted-foreground mt-1">Actions are running…</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result phase */}
        {phase.kind === "result" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center text-center gap-2 py-4">
                {phase.result.status === "SUCCESS" ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-success" />
                    <p className="text-lg font-semibold text-foreground">Plan executed successfully</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-destructive" />
                    <p className="text-lg font-semibold text-foreground">Some actions failed</p>
                    <p className="text-sm text-muted-foreground">Check the individual results below.</p>
                  </>
                )}
              </div>

              {/* Per-action result cards */}
              <div className="space-y-3">
                {phase.plan.actions.map(action => {
                  const actionResult = (phase.result.actions ?? []).find(r => r.index === action.index);
                  if (!actionResult) return <ActionCard key={action.index} action={action} />;
                  return (
                    <ActionResultCard
                      key={action.index}
                      action={action}
                      result={actionResult}
                      onGoToSettings={() => router.push("/dashboard/settings")}
                    />
                  );
                })}
              </div>

              <Button className="w-full" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start a new instruction
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error phase */}
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

      {/* MEDIUM risk dialog */}
      <Dialog open={mediumDialog.open} onOpenChange={(open) => setMediumDialog((d) => ({ ...d, open }))}>
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
              {mediumDialog.plan ? confirmButtonLabel(mediumDialog.plan) : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HIGH risk dialog */}
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
              {confirmDialog.plan?.actions.some(a => a.type === "SEND_EMAIL") ? (
                <>This will <strong>immediately send the email</strong>. Type <strong>CONFIRM</strong> to proceed.</>
              ) : (
                <>Type <strong>CONFIRM</strong> below to execute this high-risk plan.</>
              )}
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
              {confirmDialog.plan ? confirmButtonLabel(confirmDialog.plan) : "Execute plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
