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
import { Facebook, LinkedIn } from "@/components/social-icons";
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
  type ReadEmailRaw,
  type CreateCalendarEventRaw,
  type RescheduleCalendarEventRaw,
  type PayloadFieldError,
} from "@/lib/api";
import type { ExecutionRunResponse, ActionResultResponse } from "@/types/execution";
import { useExecutionResult } from "@/hooks/useExecutionResult";
import { ExecutionDataRenderer } from "@/components/ExecutionDataRenderer";
import { AirtableSearchMatchCard } from "@/components/airtable/AirtableSearchMatchCard";
import { AirtableCreateRecordCard } from "@/components/airtable/AirtableCreateRecordCard";
import { buildSearchPayload } from "@/lib/airtable/buildSearchPayload";
import { buildCreateRecordPayload } from "@/lib/airtable/buildCreateRecordPayload";
import type { AirtableRef, SearchAirtableResolvedPayload, CreateAirtableResolvedPayload } from "@/types/airtable";

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
  CREATE_FACEBOOK_POST:      { label: "Post to Facebook",          icon: Facebook },
  CREATE_LINKEDIN_POST:      { label: "Post to LinkedIn",          icon: LinkedIn },
  CREATE_AIRTABLE_RECORD:    { label: "Create Airtable record",    icon: Edit },
  SEARCH_AIRTABLE_RECORDS:   { label: "Search Airtable records",   icon: BarChart2 },
  LIST_AIRTABLE_BASES:       { label: "List Airtable bases",       icon: BarChart2 },
  LIST_AIRTABLE_TABLES:      { label: "List Airtable tables",      icon: BarChart2 },
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
  PENDING:   { icon: Clock,        className: "text-muted-foreground", label: "Pending" },
  RUNNING:   { icon: Loader2,      className: "text-yellow-500",       label: "Running" },
  COMPLETED: { icon: CheckCircle2, className: "text-success",          label: "Completed" },
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
  | { kind: "confirming"; plan: ActionPlanDetail }
  | { kind: "executing"; plan: ActionPlanDetail }
  | { kind: "result"; plan: ActionPlanDetail; execution: ExecutionRunResponse }
  | { kind: "error"; message: string };

interface ActionEditState {
  payload: Record<string, string>;
  savedPayload: Record<string, string>;
  fieldErrors: Record<string, string>;
  savingFields: Record<string, boolean>;
  showSaved: boolean;
}

type AllActionEditStates = Record<number, ActionEditState>;

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

function initActionStates(plan: ActionPlanDetail): AllActionEditStates {
  const states: AllActionEditStates = {};
  for (const action of plan.actions) {
    const p = action.payload as Record<string, string | number>;
    let payload: Record<string, string> = {};

    if (action.provider === "GMAIL") {
      if (action.type === "DRAFT_EMAIL" || action.type === "SEND_EMAIL") {
        payload = {
          to:      String(p.to      ?? ""),
          subject: String(p.subject ?? ""),
          body:    String(p.body    ?? ""),
          cc:      String(p.cc      ?? ""),
          bcc:     String(p.bcc     ?? ""),
        };
      } else if (action.type === "READ_EMAIL") {
        payload = {
          query:      String(p.query      ?? "in:inbox is:unread"),
          maxResults: String(p.maxResults ?? "5"),
        };
      }
    } else if (action.provider === "GOOGLE_CALENDAR") {
      if (action.type === "CREATE_CALENDAR_EVENT") {
        payload = {
          title:         String(p.title         ?? ""),
          startDateTime: toDatetimeLocal(String(p.startDateTime ?? "")),
          endDateTime:   toDatetimeLocal(String(p.endDateTime   ?? "")),
          description:   String(p.description   ?? ""),
          location:      String(p.location      ?? ""),
        };
      } else if (action.type === "RESCHEDULE_CALENDAR_EVENT") {
        payload = {
          searchQuery:           String(p.searchQuery           ?? ""),
          originalStartDateTime: toDatetimeLocal(String(p.originalStartDateTime ?? p.startDateTime ?? "")),
          startDateTime:         toDatetimeLocal(String(p.startDateTime         ?? "")),
          endDateTime:           toDatetimeLocal(String(p.endDateTime           ?? "")),
        };
      }
    } else if (action.type === "CREATE_TASK") {
      payload = {
        title:    String(p.title    ?? ""),
        priority: String(p.priority ?? ""),
        dueDate:  String(p.dueDate  ?? ""),
        notes:    String(p.notes    ?? ""),
      };
    } else if (action.type === "UPDATE_TASK") {
      payload = {
        title:    String(p.title    ?? ""),
        status:   String(p.status   ?? ""),
        priority: String(p.priority ?? ""),
      };
    } else if (action.type === "CREATE_FACEBOOK_POST") {
      payload = {
        message:   String(p.message   ?? ""),
        pageId:    String(p.pageId    ?? ""),
        link:      String(p.link      ?? ""),
        published: String(p.published ?? "true"),
      };
    } else if (action.type === "CREATE_LINKEDIN_POST") {
      payload = {
        text:       String(p.text       ?? ""),
        visibility: String(p.visibility ?? "PUBLIC"),
      };
    }

    states[action.index] = {
      payload,
      savedPayload: { ...payload },
      fieldErrors: {},
      savingFields: {},
      showSaved: false,
    };
  }
  return states;
}

function coerceAirtableRef(value: unknown): AirtableRef | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.name !== "string") return null;
  return { id: v.id, name: v.name };
}

function coerceAirtableRefList(value: unknown): AirtableRef[] {
  if (!Array.isArray(value)) return [];
  return value.map(coerceAirtableRef).filter((r): r is AirtableRef => r !== null);
}

// Seeds per-action editable state for SEARCH_AIRTABLE_RECORDS from the resolved payload
// the preview endpoint returns (selectedBase/selectedTable + the available lists).
function initAirtableSearchEdits(plan: ActionPlanDetail): Record<number, SearchAirtableResolvedPayload> {
  const states: Record<number, SearchAirtableResolvedPayload> = {};
  for (const action of plan.actions) {
    if (action.type !== "SEARCH_AIRTABLE_RECORDS") continue;
    const p = action.payload as Record<string, unknown>;
    states[action.index] = {
      selectedBase: coerceAirtableRef(p.selectedBase),
      selectedTable: coerceAirtableRef(p.selectedTable),
      searchQuery: typeof p.searchQuery === "string" ? p.searchQuery : "",
      allAvailableBases: coerceAirtableRefList(p.allAvailableBases),
      allAvailableTablesForSelectedBase: coerceAirtableRefList(p.allAvailableTablesForSelectedBase),
      pageSize: typeof p.pageSize === "number" ? p.pageSize : 20,
      offset: typeof p.offset === "string" ? p.offset : null,
      filterByFormula: typeof p.filterByFormula === "string" ? p.filterByFormula : null,
    };
  }
  return states;
}

// Seeds per-action editable state for CREATE_AIRTABLE_RECORD from the resolved payload
// the preview endpoint returns (selectedBase/selectedTable + the available lists + fields).
function initAirtableCreateEdits(plan: ActionPlanDetail): Record<number, CreateAirtableResolvedPayload> {
  const states: Record<number, CreateAirtableResolvedPayload> = {};
  for (const action of plan.actions) {
    if (action.type !== "CREATE_AIRTABLE_RECORD") continue;
    const p = action.payload as Record<string, unknown>;
    const fields = p.fields && typeof p.fields === "object" ? (p.fields as Record<string, unknown>) : {};
    states[action.index] = {
      fields,
      selectedBase: coerceAirtableRef(p.selectedBase),
      selectedTable: coerceAirtableRef(p.selectedTable),
      allAvailableBases: coerceAirtableRefList(p.allAvailableBases),
      allAvailableTablesForSelectedBase: coerceAirtableRefList(p.allAvailableTablesForSelectedBase),
    };
  }
  return states;
}

// Validates the server-saved payload against required field rules (used for the confirm gate).
function getRequiredFieldErrors(actionType: ActionType, saved: Record<string, string>): Record<string, string> {
  const e: Record<string, string> = {};

  if (actionType === "SEND_EMAIL") {
    const to = saved.to?.trim() ?? "";
    if (!to) e.to = "Recipient is required.";
    else if (!EMAIL_REGEX.test(to)) e.to = "Enter a valid email address.";
  }

  if (actionType === "CREATE_CALENDAR_EVENT") {
    if (!saved.startDateTime?.trim()) e.startDateTime = "Start time is required.";
    else if (!isValidDatetime(saved.startDateTime)) e.startDateTime = "Enter a valid date and time.";
    if (!saved.endDateTime?.trim()) e.endDateTime = "End time is required.";
    else if (!isValidDatetime(saved.endDateTime)) e.endDateTime = "Enter a valid date and time.";
  }

  if (actionType === "RESCHEDULE_CALENDAR_EVENT") {
    if (!saved.searchQuery?.trim()) e.searchQuery = "Event description is required.";
    if (!saved.startDateTime?.trim()) e.startDateTime = "New start time is required.";
    else if (!isValidDatetime(saved.startDateTime)) e.startDateTime = "Enter a valid date and time.";
    if (!saved.endDateTime?.trim()) e.endDateTime = "New end time is required.";
    else if (!isValidDatetime(saved.endDateTime)) e.endDateTime = "Enter a valid date and time.";
  }

  if (actionType === "CREATE_TASK" || actionType === "UPDATE_TASK") {
    if (!saved.title?.trim()) e.title = "Title is required.";
  }

  if (actionType === "CREATE_FACEBOOK_POST") {
    if (!saved.message?.trim()) e.message = "Message is required.";
    if (saved.link?.trim() && !/^https?:\/\/.+/.test(saved.link.trim())) e.link = "Must start with http:// or https://";
    if (saved.published?.trim() && !["true", "false"].includes(saved.published.trim().toLowerCase())) e.published = "Must be true or false.";
  }

  if (actionType === "CREATE_LINKEDIN_POST") {
    if (!saved.text?.trim()) e.text = "Post text is required.";
    else if (saved.text.length > 3000) e.text = "Post text must be under 3,000 characters.";
    if (saved.visibility?.trim() && !["PUBLIC", "CONNECTIONS"].includes(saved.visibility.trim())) e.visibility = "Must be PUBLIC or CONNECTIONS.";
  }

  return e;
}

function confirmButtonLabel(plan: ActionPlanDetail): string {
  if (plan.actions.length === 1) {
    switch (plan.actions[0].type) {
      case "CREATE_TASK":               return "Create Task";
      case "UPDATE_TASK":               return "Update Task";
      case "DRAFT_EMAIL":               return "Create Draft";
      case "SEND_EMAIL":                return "Send Email";
      case "READ_EMAIL":                return "Fetch Emails";
      case "CREATE_CALENDAR_EVENT":     return "Create Event";
      case "RESCHEDULE_CALENDAR_EVENT": return "Reschedule Event";
      case "CREATE_FACEBOOK_POST":      return "Post to Facebook";
      case "CREATE_LINKEDIN_POST":      return "Post to LinkedIn";
      case "CREATE_AIRTABLE_RECORD":    return "Create Record";
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
    case "CREATE_FACEBOOK_POST":
      return p.message ? `"${p.message.slice(0, 60)}${p.message.length > 60 ? "…" : ""}"` : "";
    case "CREATE_LINKEDIN_POST":
      return p.text ? `"${p.text.slice(0, 60)}${p.text.length > 60 ? "…" : ""}"` : "";
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
  const meta = ACTION_META[action.type as ActionType];
  const Icon = meta?.icon ?? Zap;
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
  savingFields,
  locked,
  onChange,
  onBlur,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  savingFields: Record<string, boolean>;
  locked: boolean;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
}) {
  const fieldLabel = (name: string, label: string, required?: boolean) => (
    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-destructive">*</span>}
      {savingFields[name] && <Loader2 className="h-3 w-3 animate-spin" />}
    </Label>
  );

  if (action.type === "DRAFT_EMAIL") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("to", "To")}
          <Input
            value={edits.to ?? ""}
            onChange={e => onChange("to", e.target.value)}
            onBlur={() => onBlur("to")}
            disabled={locked}
            placeholder="(fill in Gmail before sending)"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          {fieldLabel("subject", "Subject")}
          <Input
            value={edits.subject ?? ""}
            onChange={e => onChange("subject", e.target.value)}
            onBlur={() => onBlur("subject")}
            disabled={locked}
            placeholder="Subject"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          {fieldLabel("body", "Body")}
          <Textarea
            value={edits.body ?? ""}
            onChange={e => onChange("body", e.target.value)}
            onBlur={() => onBlur("body")}
            disabled={locked}
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
          {fieldLabel("to", "To", true)}
          <Input
            value={edits.to ?? ""}
            onChange={e => onChange("to", e.target.value)}
            onBlur={() => onBlur("to")}
            disabled={locked}
            placeholder="recipient@example.com"
            className={`h-8 text-sm ${errors.to ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {errors.to && <p className="text-xs text-destructive">{errors.to}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            {fieldLabel("cc", "CC")}
            <Input value={edits.cc ?? ""} onChange={e => onChange("cc", e.target.value)} onBlur={() => onBlur("cc")} disabled={locked} placeholder="Optional" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            {fieldLabel("bcc", "BCC")}
            <Input value={edits.bcc ?? ""} onChange={e => onChange("bcc", e.target.value)} onBlur={() => onBlur("bcc")} disabled={locked} placeholder="Optional" className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          {fieldLabel("subject", "Subject")}
          <Input value={edits.subject ?? ""} onChange={e => onChange("subject", e.target.value)} onBlur={() => onBlur("subject")} disabled={locked} placeholder="Subject" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          {fieldLabel("body", "Body")}
          <Textarea value={edits.body ?? ""} onChange={e => onChange("body", e.target.value)} onBlur={() => onBlur("body")} disabled={locked} placeholder="Email body…" className="min-h-[80px] text-sm resize-none" />
        </div>
      </div>
    );
  }

  if (action.type === "READ_EMAIL") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("query", "Search query")}
          <Input
            value={edits.query ?? ""}
            onChange={e => onChange("query", e.target.value)}
            onBlur={() => onBlur("query")}
            disabled={locked}
            placeholder="in:inbox is:unread"
            className="h-8 text-sm font-mono"
          />
          <div className="flex flex-wrap gap-1.5">
            {READ_EMAIL_SUGGESTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange("query", s.value)}
                disabled={locked}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {fieldLabel("maxResults", "Max results (1–20)")}
          <Input
            type="number"
            min={1}
            max={20}
            value={edits.maxResults ?? "5"}
            onChange={e => onChange("maxResults", e.target.value)}
            onBlur={() => onBlur("maxResults")}
            disabled={locked}
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
  savingFields,
  locked,
  onChange,
  onBlur,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  savingFields: Record<string, boolean>;
  locked: boolean;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
}) {
  const fieldLabel = (name: string, label: string, required?: boolean) => (
    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-destructive">*</span>}
      {savingFields[name] && <Loader2 className="h-3 w-3 animate-spin" />}
    </Label>
  );

  if (action.type === "CREATE_CALENDAR_EVENT") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("title", "Title")}
          <Input value={edits.title ?? ""} onChange={e => onChange("title", e.target.value)} onBlur={() => onBlur("title")} disabled={locked} placeholder="Meeting title" className="h-8 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            {fieldLabel("startDateTime", "Start", true)}
            <Input
              type="datetime-local"
              value={edits.startDateTime ?? ""}
              onChange={e => onChange("startDateTime", e.target.value)}
              onBlur={() => onBlur("startDateTime")}
              disabled={locked}
              className={`h-8 text-sm ${errors.startDateTime ? "border-destructive" : ""}`}
            />
            {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime}</p>}
          </div>
          <div className="space-y-1.5">
            {fieldLabel("endDateTime", "End", true)}
            <Input
              type="datetime-local"
              value={edits.endDateTime ?? ""}
              onChange={e => onChange("endDateTime", e.target.value)}
              onBlur={() => onBlur("endDateTime")}
              disabled={locked}
              className={`h-8 text-sm ${errors.endDateTime ? "border-destructive" : ""}`}
            />
            {errors.endDateTime && <p className="text-xs text-destructive">{errors.endDateTime}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          {fieldLabel("description", "Description")}
          <Textarea value={edits.description ?? ""} onChange={e => onChange("description", e.target.value)} onBlur={() => onBlur("description")} disabled={locked} placeholder="Optional" className="min-h-[60px] text-sm resize-none" />
        </div>
        <div className="space-y-1.5">
          {fieldLabel("location", "Location")}
          <Input value={edits.location ?? ""} onChange={e => onChange("location", e.target.value)} onBlur={() => onBlur("location")} disabled={locked} placeholder="Optional" className="h-8 text-sm" />
        </div>
      </div>
    );
  }

  if (action.type === "RESCHEDULE_CALENDAR_EVENT") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("searchQuery", "Event to reschedule", true)}
          <Input
            value={edits.searchQuery ?? ""}
            onChange={e => onChange("searchQuery", e.target.value)}
            onBlur={() => onBlur("searchQuery")}
            disabled={locked}
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
            {fieldLabel("startDateTime", "New start", true)}
            <Input
              type="datetime-local"
              value={edits.startDateTime ?? ""}
              onChange={e => onChange("startDateTime", e.target.value)}
              onBlur={() => onBlur("startDateTime")}
              disabled={locked}
              className={`h-8 text-sm ${errors.startDateTime ? "border-destructive" : ""}`}
            />
            {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime}</p>}
          </div>
          <div className="space-y-1.5">
            {fieldLabel("endDateTime", "New end", true)}
            <Input
              type="datetime-local"
              value={edits.endDateTime ?? ""}
              onChange={e => onChange("endDateTime", e.target.value)}
              onBlur={() => onBlur("endDateTime")}
              disabled={locked}
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

// Editable Facebook post payload form.
function FacebookPayloadEditor({
  edits,
  errors,
  savingFields,
  locked,
  onChange,
  onBlur,
}: {
  edits: Record<string, string>;
  errors: Record<string, string>;
  savingFields: Record<string, boolean>;
  locked: boolean;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
}) {
  const fieldLabel = (name: string, label: string, required?: boolean) => (
    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-destructive">*</span>}
      {savingFields[name] && <Loader2 className="h-3 w-3 animate-spin" />}
    </Label>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {fieldLabel("message", "Message", true)}
        <Textarea
          value={edits.message ?? ""}
          onChange={e => onChange("message", e.target.value)}
          onBlur={() => onBlur("message")}
          disabled={locked}
          placeholder="What's on your mind?"
          className={`min-h-[80px] text-sm resize-none ${errors.message ? "border-destructive" : ""}`}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <div className="space-y-1.5">
        {fieldLabel("pageId", "Page ID")}
        <Input
          value={edits.pageId ?? ""}
          onChange={e => onChange("pageId", e.target.value)}
          onBlur={() => onBlur("pageId")}
          disabled={locked}
          placeholder="Leave blank to post to personal profile"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        {fieldLabel("link", "Link URL")}
        <Input
          value={edits.link ?? ""}
          onChange={e => onChange("link", e.target.value)}
          onBlur={() => onBlur("link")}
          disabled={locked}
          placeholder="https://example.com (optional)"
          className={`h-8 text-sm ${errors.link ? "border-destructive" : ""}`}
        />
        {errors.link && <p className="text-xs text-destructive">{errors.link}</p>}
      </div>
      <div className="flex items-center gap-3">
        {fieldLabel("published", "Publish immediately")}
        <button
          type="button"
          disabled={locked}
          onClick={() => onChange("published", edits.published === "true" ? "false" : "true")}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            edits.published === "false" ? "bg-muted" : "bg-foreground"
          }`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform ${
            edits.published === "false" ? "translate-x-0" : "translate-x-4"
          }`} />
        </button>
        <span className="text-xs text-muted-foreground">
          {edits.published === "false" ? "Draft / scheduled" : "Publish now"}
        </span>
      </div>
    </div>
  );
}

// Editable LinkedIn post payload form.
function LinkedInPayloadEditor({
  edits,
  errors,
  savingFields,
  locked,
  onChange,
  onBlur,
}: {
  edits: Record<string, string>;
  errors: Record<string, string>;
  savingFields: Record<string, boolean>;
  locked: boolean;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
}) {
  const maxChars = 3000;
  const charCount = edits.text?.length ?? 0;
  const overLimit = charCount > maxChars;

  const fieldLabel = (name: string, label: string, required?: boolean) => (
    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-destructive">*</span>}
      {savingFields[name] && <Loader2 className="h-3 w-3 animate-spin" />}
    </Label>
  );

  const selectClass = "h-8 text-sm w-full rounded-md border border-input bg-background px-3 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          {fieldLabel("text", "Post text", true)}
          <span className={`text-xs ${overLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {charCount}/{maxChars}
          </span>
        </div>
        <Textarea
          value={edits.text ?? ""}
          onChange={e => onChange("text", e.target.value)}
          onBlur={() => onBlur("text")}
          disabled={locked}
          placeholder="What do you want to share?"
          className={`min-h-[100px] text-sm resize-none ${errors.text || overLimit ? "border-destructive" : ""}`}
        />
        {errors.text && <p className="text-xs text-destructive">{errors.text}</p>}
      </div>
      <div className="space-y-1.5">
        {fieldLabel("visibility", "Audience")}
        <select
          value={edits.visibility ?? "PUBLIC"}
          onChange={e => onChange("visibility", e.target.value)}
          onBlur={() => onBlur("visibility")}
          disabled={locked}
          className={selectClass}
        >
          <option value="PUBLIC">Anyone (Public)</option>
          <option value="CONNECTIONS">Connections only</option>
        </select>
      </div>
    </div>
  );
}

// Editable task payload form (CREATE_TASK and UPDATE_TASK).
function TaskPayloadEditor({
  action,
  edits,
  errors,
  savingFields,
  locked,
  onChange,
  onBlur,
}: {
  action: ActionPlanDetail["actions"][number];
  edits: Record<string, string>;
  errors: Record<string, string>;
  savingFields: Record<string, boolean>;
  locked: boolean;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
}) {
  const selectClass = "h-8 text-sm w-full rounded-md border border-input bg-background px-3 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  const fieldLabel = (name: string, label: string, required?: boolean) => (
    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-destructive">*</span>}
      {savingFields[name] && <Loader2 className="h-3 w-3 animate-spin" />}
    </Label>
  );

  if (action.type === "CREATE_TASK") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("title", "Title", true)}
          <Input
            value={edits.title ?? ""}
            onChange={e => onChange("title", e.target.value)}
            onBlur={() => onBlur("title")}
            disabled={locked}
            placeholder="Task title"
            className={`h-8 text-sm ${errors.title ? "border-destructive" : ""}`}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            {fieldLabel("priority", "Priority")}
            <select
              value={edits.priority ?? ""}
              onChange={e => onChange("priority", e.target.value)}
              onBlur={() => onBlur("priority")}
              disabled={locked}
              className={selectClass}
            >
              <option value="">No priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="space-y-1.5">
            {fieldLabel("dueDate", "Due date")}
            <Input
              type="date"
              value={edits.dueDate ?? ""}
              onChange={e => onChange("dueDate", e.target.value)}
              onBlur={() => onBlur("dueDate")}
              disabled={locked}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          {fieldLabel("notes", "Notes")}
          <Textarea
            value={edits.notes ?? ""}
            onChange={e => onChange("notes", e.target.value)}
            onBlur={() => onBlur("notes")}
            disabled={locked}
            placeholder="Optional"
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }

  if (action.type === "UPDATE_TASK") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          {fieldLabel("title", "Title", true)}
          <Input
            value={edits.title ?? ""}
            onChange={e => onChange("title", e.target.value)}
            onBlur={() => onBlur("title")}
            disabled={locked}
            placeholder="Task title"
            className={`h-8 text-sm ${errors.title ? "border-destructive" : ""}`}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            {fieldLabel("status", "Status")}
            <select
              value={edits.status ?? ""}
              onChange={e => onChange("status", e.target.value)}
              onBlur={() => onBlur("status")}
              disabled={locked}
              className={selectClass}
            >
              <option value="">Unchanged</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="space-y-1.5">
            {fieldLabel("priority", "Priority")}
            <select
              value={edits.priority ?? ""}
              onChange={e => onChange("priority", e.target.value)}
              onBlur={() => onBlur("priority")}
              disabled={locked}
              className={selectClass}
            >
              <option value="">Unchanged</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Expanded card with editable payload for Gmail, Calendar, Task, and Airtable actions.
function EditableActionCard({
  action,
  state,
  locked,
  onFieldChange,
  onFieldBlur,
  explain,
  airtableSearchPayload,
  onAirtableSearchChange,
  airtableCreatePayload,
  onAirtableCreateChange,
}: {
  action: ActionPlanDetail["actions"][number];
  state: ActionEditState;
  locked: boolean;
  onFieldChange: (field: string, value: string) => void;
  onFieldBlur: (field: string) => void;
  explain: ActionPlanDetail["explain"];
  airtableSearchPayload?: SearchAirtableResolvedPayload;
  onAirtableSearchChange: (next: SearchAirtableResolvedPayload) => void;
  airtableCreatePayload?: CreateAirtableResolvedPayload;
  onAirtableCreateChange: (next: CreateAirtableResolvedPayload) => void;
}) {
  const isEditable =
    action.provider === "GMAIL" ||
    action.provider === "GOOGLE_CALENDAR" ||
    action.type === "CREATE_TASK" ||
    action.type === "UPDATE_TASK" ||
    action.type === "CREATE_FACEBOOK_POST" ||
    action.type === "CREATE_LINKEDIN_POST" ||
    (action.type === "SEARCH_AIRTABLE_RECORDS" && !!airtableSearchPayload) ||
    (action.type === "CREATE_AIRTABLE_RECORD" && !!airtableCreatePayload);
  if (!isEditable) return <ActionCard action={action} />;

  const meta = ACTION_META[action.type as ActionType];
  const Icon = meta?.icon ?? Zap;
  const isSaving = Object.values(state.savingFields).some(Boolean);
  const hasErrors = Object.values(state.fieldErrors).some(Boolean);

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${hasErrors ? "border-destructive/50" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-3.5 w-3.5 text-foreground" />
          </div>
          <span className="font-medium text-sm text-foreground">{meta?.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          {state.showSaved && !isSaving && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </span>
          )}
          <RiskBadge level={action.riskLevel} />
        </div>
      </div>
      {action.provider === "GMAIL" && (
        <GmailPayloadEditor
          action={action}
          edits={state.payload}
          errors={state.fieldErrors}
          savingFields={state.savingFields}
          locked={locked}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      )}
      {action.provider === "GOOGLE_CALENDAR" && (
        <CalendarPayloadEditor
          action={action}
          edits={state.payload}
          errors={state.fieldErrors}
          savingFields={state.savingFields}
          locked={locked}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      )}
      {(action.type === "CREATE_TASK" || action.type === "UPDATE_TASK") && (
        <TaskPayloadEditor
          action={action}
          edits={state.payload}
          errors={state.fieldErrors}
          savingFields={state.savingFields}
          locked={locked}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      )}
      {action.type === "CREATE_FACEBOOK_POST" && (
        <FacebookPayloadEditor
          edits={state.payload}
          errors={state.fieldErrors}
          savingFields={state.savingFields}
          locked={locked}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      )}
      {action.type === "CREATE_LINKEDIN_POST" && (
        <LinkedInPayloadEditor
          edits={state.payload}
          errors={state.fieldErrors}
          savingFields={state.savingFields}
          locked={locked}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      )}
      {action.type === "SEARCH_AIRTABLE_RECORDS" && airtableSearchPayload && (
        <AirtableSearchMatchCard
          payload={airtableSearchPayload}
          confidence={explain.confidence}
          triggers={explain.triggers}
          locked={locked}
          onChange={onAirtableSearchChange}
        />
      )}
      {action.type === "CREATE_AIRTABLE_RECORD" && airtableCreatePayload && (
        <AirtableCreateRecordCard
          payload={airtableCreatePayload}
          confidence={explain.confidence}
          triggers={explain.triggers}
          locked={locked}
          onChange={onAirtableCreateChange}
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
  result: ActionResultResponse;
  onGoToSettings: () => void;
}) {
  const meta = ACTION_META[action.type as ActionType];
  const Icon = meta?.icon ?? Zap;
  const ok = result.status === "SUCCESS";
  const credentialError = result.errorCode === "NO_CREDENTIALS" || result.errorCode === "TOKEN_EXPIRED";
  const reconnectLabel =
    action.provider === "GMAIL" ? "Reconnect Gmail" :
    action.provider === "GOOGLE_CALENDAR" ? "Reconnect Google Calendar" :
    action.provider === "FACEBOOK" ? "Reconnect Facebook" :
    action.provider === "LINKEDIN" ? "Reconnect LinkedIn" :
    "Reconnect";

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

          {action.type === "READ_EMAIL" && result.data && (() => {
            const raw = result.data as unknown as ReadEmailRaw;
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

          {action.type === "CREATE_CALENDAR_EVENT" && result.data && (() => {
            const raw = result.data as unknown as CreateCalendarEventRaw;
            return (
              <div className="space-y-1.5">
                {raw.title && <p className="text-sm font-medium text-foreground">{raw.title}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(raw.newStartDateTime).toLocaleString()}
                  {" – "}
                  {new Date(raw.newEndDateTime).toLocaleString()}
                </p>
                <a href={raw.htmlLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Calendar
                </a>
              </div>
            );
          })()}

          {action.type === "RESCHEDULE_CALENDAR_EVENT" && result.data && (() => {
            const raw = result.data as unknown as RescheduleCalendarEventRaw;
            return (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Rescheduled: {raw.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(raw.oldStartDateTime).toLocaleString()}
                  {" → "}
                  {new Date(raw.newStartDateTime).toLocaleString()}
                  {" – "}
                  {new Date(raw.newEndDateTime).toLocaleString()}
                </p>
                <a href={raw.htmlLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Google Calendar
                </a>
              </div>
            );
          })()}

          {(action.type === "CREATE_FACEBOOK_POST" || action.type === "CREATE_LINKEDIN_POST") && result.link && (
            <a href={result.link} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              View Post
            </a>
          )}

          {(action.type === "CREATE_AIRTABLE_RECORD" || action.type === "SEARCH_AIRTABLE_RECORDS") && (
            <ExecutionDataRenderer action={result} />
          )}
        </>
      )}

      {/* Failed content */}
      {!ok && (
        <div className="space-y-2">
          {result.errorMessage && (
            <p className="text-sm text-destructive">{result.errorMessage}</p>
          )}

          {result.errorCode === "EVENT_NOT_FOUND" && (
            <p className="text-xs text-muted-foreground">
              We couldn&apos;t find the event. Check Google Calendar and try again with a more specific description.
            </p>
          )}

          {credentialError && (
            <Button variant="outline" size="sm" onClick={onGoToSettings} className="text-xs h-7">
              {reconnectLabel}
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
                    {t.phrase} → {(t.maps_to ?? t.meaning ?? "").replace(/_/g, " ")}
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
  const [actionStates, setActionStates] = useState<AllActionEditStates>({});
  const [airtableSearchEdits, setAirtableSearchEdits] = useState<Record<number, SearchAirtableResolvedPayload>>({});
  const airtableSearchOriginal = useRef<Record<number, SearchAirtableResolvedPayload>>({});
  const [airtableCreateEdits, setAirtableCreateEdits] = useState<Record<number, CreateAirtableResolvedPayload>>({});
  const airtableCreateOriginal = useRef<Record<number, CreateAirtableResolvedPayload>>({});
  const [planLocked, setPlanLocked] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [history, setHistory] = useState<ActionPlanSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

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
      setHistory(data.content);
    } catch {
      // non-fatal
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user) loadHistory();
  }, [initialized, user, loadHistory]);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(t => clearTimeout(t));
    };
  }, []);

  // ── Execution polling ──
  const executingPlanId =
    phase.kind === "executing" ? phase.plan.actionPlanId : null;
  const { result: execResult, error: execError, timedOut: execTimedOut } =
    useExecutionResult(executingPlanId, phase.kind === "executing");

  useEffect(() => {
    if (!execResult) return;
    if (execResult.status === "SUCCESS" || execResult.status === "FAILED") {
      setPhase((prev) => {
        if (prev.kind !== "executing") return prev;
        return { kind: "result", plan: prev.plan, execution: execResult };
      });
      loadHistory();
    }
  }, [execResult, loadHistory]);

  useEffect(() => {
    if (execError) {
      setPhase((prev) => {
        if (prev.kind !== "executing") return prev;
        return { kind: "error", message: execError };
      });
    }
  }, [execError]);

  useEffect(() => {
    if (execTimedOut) {
      setPhase((prev) => {
        if (prev.kind !== "executing") return prev;
        return { kind: "error", message: "Taking longer than expected — check back later." };
      });
    }
  }, [execTimedOut]);

  if (!initialized || !user) return null;

  // ── Derived draft-phase values ──

  const draftPlan = phase.kind === "draft" ? phase.plan : null;
  const draftHasSendEmail = draftPlan ? draftPlan.actions.some(a => a.type === "SEND_EMAIL") : false;

  const canConfirm = !planLocked && draftPlan !== null &&
    draftPlan.actions.every(action => {
      if (action.type === "SEARCH_AIRTABLE_RECORDS") {
        const edit = airtableSearchEdits[action.index];
        return !!edit && !!edit.selectedBase && !!edit.selectedTable;
      }
      if (action.type === "CREATE_AIRTABLE_RECORD") {
        const edit = airtableCreateEdits[action.index];
        return !!edit && !!edit.selectedBase && !!edit.selectedTable;
      }
      const state = actionStates[action.index];
      if (!state) return true;
      if (Object.values(state.savingFields).some(Boolean)) return false;
      if (Object.values(state.fieldErrors).some(Boolean)) return false;
      return Object.keys(getRequiredFieldErrors(action.type, state.savedPayload)).length === 0;
    });

  // ── Handlers ──

  async function handlePreview() {
    if (!instruction.trim()) return;
    setPhase({ kind: "previewing" });
    try {
      const plan = await actionPlansApi.preview(instruction.trim());
      setPhase({ kind: "draft", plan });
      setActionStates(initActionStates(plan));
      const airtableEdits = initAirtableSearchEdits(plan);
      setAirtableSearchEdits(airtableEdits);
      airtableSearchOriginal.current = airtableEdits;
      const airtableCreateEditsInit = initAirtableCreateEdits(plan);
      setAirtableCreateEdits(airtableCreateEditsInit);
      airtableCreateOriginal.current = airtableCreateEditsInit;
      setPlanLocked(false);
    } catch (err: unknown) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Preview failed." });
    }
  }

  function handleFieldChange(actionIndex: number, field: string, value: string) {
    setActionStates(prev => {
      const cur = prev[actionIndex];
      if (!cur) return prev;
      return {
        ...prev,
        [actionIndex]: {
          ...cur,
          payload: { ...cur.payload, [field]: value },
          fieldErrors: { ...cur.fieldErrors, [field]: "" },
          showSaved: false,
        },
      };
    });
  }

  async function handleFieldBlur(planId: string, actionIndex: number, field: string) {
    const state = actionStates[actionIndex];
    if (!state || planLocked) return;

    const current = state.payload[field] ?? "";
    const saved = state.savedPayload[field] ?? "";
    if (current === saved) return;

    setActionStates(prev => ({
      ...prev,
      [actionIndex]: {
        ...prev[actionIndex]!,
        savingFields: { ...prev[actionIndex]!.savingFields, [field]: true },
        showSaved: false,
      },
    }));

    try {
      const result = await actionPlansApi.updatePayload(planId, actionIndex, state.payload);
      const newSaved = Object.fromEntries(
        Object.entries(result.payload).map(([k, v]) => [k, String(v ?? "")])
      );
      setActionStates(prev => ({
        ...prev,
        [actionIndex]: {
          ...prev[actionIndex]!,
          savedPayload: newSaved,
          fieldErrors: {},
          savingFields: { ...prev[actionIndex]!.savingFields, [field]: false },
          showSaved: true,
        },
      }));
      if (saveTimers.current[actionIndex]) clearTimeout(saveTimers.current[actionIndex]);
      saveTimers.current[actionIndex] = setTimeout(() => {
        setActionStates(prev => {
          const s = prev[actionIndex];
          if (!s) return prev;
          return { ...prev, [actionIndex]: { ...s, showSaved: false } };
        });
      }, 2000);
    } catch (err: unknown) {
      const e = err as { code?: string; errors?: PayloadFieldError[] };
      if (e.code === "CONFLICT") {
        setPlanLocked(true);
        setActionStates(prev => ({
          ...prev,
          [actionIndex]: {
            ...prev[actionIndex]!,
            savingFields: { ...prev[actionIndex]!.savingFields, [field]: false },
          },
        }));
      } else {
        const fieldErrors: Record<string, string> = {};
        if (e.code === "VALIDATION" && Array.isArray(e.errors)) {
          e.errors.forEach((fe) => { fieldErrors[fe.field] = fe.message; });
        } else {
          fieldErrors[field] = "Failed to save. Please try again.";
        }
        setActionStates(prev => ({
          ...prev,
          [actionIndex]: {
            ...prev[actionIndex]!,
            fieldErrors,
            savingFields: { ...prev[actionIndex]!.savingFields, [field]: false },
          },
        }));
      }
    }
  }

  async function executeConfirm(plan: ActionPlanDetail) {
    setPhase({ kind: "confirming", plan });
    try {
      for (const action of plan.actions) {
        if (action.type === "SEARCH_AIRTABLE_RECORDS") {
          const edited = airtableSearchEdits[action.index];
          const original = airtableSearchOriginal.current[action.index];
          if (!edited || JSON.stringify(edited) === JSON.stringify(original)) continue;
          await actionPlansApi.updatePayload(plan.actionPlanId, action.index, buildSearchPayload(edited));
        } else if (action.type === "CREATE_AIRTABLE_RECORD") {
          const edited = airtableCreateEdits[action.index];
          const original = airtableCreateOriginal.current[action.index];
          if (!edited || JSON.stringify(edited) === JSON.stringify(original)) continue;
          await actionPlansApi.updatePayload(plan.actionPlanId, action.index, buildCreateRecordPayload(edited));
        }
      }
      await actionPlansApi.confirm(plan.actionPlanId);
      setPhase({ kind: "executing", plan });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "CONFLICT") {
        setPlanLocked(true);
        setPhase({ kind: "draft", plan });
        return;
      }
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Confirm failed." });
    }
  }

  function handleConfirm(plan: ActionPlanDetail) {
    if (!canConfirm) return;
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
    setActionStates({});
    setPlanLocked(false);
    Object.values(saveTimers.current).forEach(t => clearTimeout(t));
    saveTimers.current = {};
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
              disabled={phase.kind === "previewing" || phase.kind === "confirming" || phase.kind === "executing"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePreview();
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Post to Facebook", value: "Post to my Facebook page: Excited to announce our new feature!" },
                { label: "Post to LinkedIn", value: "Share on LinkedIn: We're hiring senior engineers — apply now." },
              ].map(hint => (
                <button
                  key={hint.label}
                  type="button"
                  disabled={phase.kind === "previewing" || phase.kind === "confirming" || phase.kind === "executing"}
                  onClick={() => setInstruction(hint.value)}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
                >
                  {hint.label}
                </button>
              ))}
            </div>
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
              {planLocked && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This plan has already been confirmed and can no longer be edited. Please start a new instruction.</span>
                </div>
              )}

              <div className="space-y-3">
                {phase.plan.actions.map((action) => (
                  <EditableActionCard
                    key={action.index}
                    action={action}
                    state={actionStates[action.index] ?? { payload: {}, savedPayload: {}, fieldErrors: {}, savingFields: {}, showSaved: false }}
                    locked={planLocked}
                    onFieldChange={(field, value) => handleFieldChange(action.index, field, value)}
                    onFieldBlur={(field) => handleFieldBlur(phase.plan.actionPlanId, action.index, field)}
                    explain={phase.plan.explain}
                    airtableSearchPayload={airtableSearchEdits[action.index]}
                    onAirtableSearchChange={(next) =>
                      setAirtableSearchEdits(prev => ({ ...prev, [action.index]: next }))
                    }
                    airtableCreatePayload={airtableCreateEdits[action.index]}
                    onAirtableCreateChange={(next) =>
                      setAirtableCreateEdits(prev => ({ ...prev, [action.index]: next }))
                    }
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
                  disabled={!canConfirm}
                  className="flex-1"
                >
                  {confirmButtonLabel(phase.plan)}
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirming / Executing phase */}
        {(phase.kind === "confirming" || phase.kind === "executing") && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-muted" />
                  <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {phase.kind === "confirming" ? "Confirming plan…" : "Executing plan"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phase.kind === "executing" ? "Actions are running — this usually takes 1–5 seconds." : "Sending to execution engine…"}
                  </p>
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
                {phase.execution.status === "SUCCESS" ? (
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
                  const actionResult = phase.execution.actions.find(
                    r => r.actionIndex === action.index
                  );
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
