const API_BASE = "http://localhost:8081";

// ── Types ────────────────────────────────────────────────────────────────────

export type TenantRole = "TENANT_ADMIN" | "TENANT_MEMBER";

export interface TenantSummary {
  id: string;
  name: string;
  role: TenantRole;
}

export interface ApiUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: ApiUser;
  requiresTenantSetup: boolean;
  activeTenantId: string | null;
  tenants: TenantSummary[];
}

export interface ApiError {
  code: "VALIDATION" | "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL";
  message: string;
  timestamp: string;
}

// ── Module-level token store ─────────────────────────────────────────────────

let _accessToken: string | null = null;
let _onRefresh: (() => Promise<string | null>) | null = null;

export const tokenStore = {
  getAccessToken: () => _accessToken,
  setAccessToken: (token: string | null) => {
    _accessToken = token;
  },
  setRefreshHandler: (fn: () => Promise<string | null>) => {
    _onRefresh = fn;
  },
};

// ── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = tokenStore.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry && _onRefresh) {
    const newToken = await _onRefresh();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw Object.assign(new Error("Session expired"), { code: "UNAUTHORIZED" });
  }

  if (res.status === 204) return null as T;

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({
      code: "INTERNAL",
      message: `HTTP ${res.status}`,
      timestamp: new Date().toISOString(),
    }));
    throw Object.assign(new Error(err.message), { code: err.code });
  }

  return res.json() as Promise<T>;
}

// ── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    apiFetch<{ message: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyEmail: (token: string) =>
    apiFetch<AuthTokenResponse>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendEmail: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/resend-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthTokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<AuthTokenResponse>(
      "/api/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      false
    ),

  logout: (refreshToken: string) =>
    apiFetch<null>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  verifyResetToken: (token: string) =>
    apiFetch<{ valid: boolean; email: string | null }>(
      `/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`
    ),
};

// ── Invite types ─────────────────────────────────────────────────────────────

export interface InviteResponse {
  inviteId: string;
  email: string;
  role: TenantRole;
  expiresAt: string;
  inviteToken: string;
  inviteUrl: string;
}

// ── Invite endpoints ─────────────────────────────────────────────────────────

export const invitesApi = {
  create: (body: { email: string; role: TenantRole; expiresInHours?: number }) =>
    apiFetch<InviteResponse>("/api/v1/invites", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  accept: (inviteToken: string, password: string) =>
    apiFetch<AuthTokenResponse>("/api/v1/invites/accept", {
      method: "POST",
      body: JSON.stringify({ inviteToken, password }),
    }),
};

// ── Task types ───────────────────────────────────────────────────────────────

export type TaskStatus = "OPEN" | "DONE";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string | null;
  status: TaskStatus;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  dueAt?: string;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  dueAt?: string | null;
  status?: TaskStatus;
}

// ── Task endpoints ───────────────────────────────────────────────────────────

// ── Action plan types ────────────────────────────────────────────────────────

export type ActionPlanStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "EXECUTING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export type ActionType =
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "CREATE_CALENDAR_EVENT"
  | "RESCHEDULE_CALENDAR_EVENT"
  | "DRAFT_EMAIL"
  | "SEND_EMAIL"
  | "TRIGGER_WORKFLOW"
  | "LOG_CRM_ACTIVITY"
  | "UPDATE_DEAL_STATUS";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ExecutionEngineType = "N8N" | "DIRECT" | "HYBRID";

export interface ActionExplain {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  triggers: Array<{ phrase: string; maps_to: string }>;
  defaults: Array<{ field: string; value: string }>;
  willNot: string[];
}

export interface PlanAction {
  index: number;
  type: ActionType;
  provider: IntegrationProvider;
  riskLevel: RiskLevel;
  payload: Record<string, unknown>;
}

export interface ActionPlanDetail {
  actionPlanId: string;
  status: ActionPlanStatus;
  riskLevel: RiskLevel;
  explain: ActionExplain;
  actions: PlanAction[];
}

export interface ActionPlanSummary {
  id: string;
  inputText: string;
  status: ActionPlanStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  confirmedAt: string | null;
}

export interface ConfirmResponse {
  status: ActionPlanStatus;
  requestId: string;
  engineType: ExecutionEngineType;
}

// ── Action plan endpoints ─────────────────────────────────────────────────────

export const actionPlansApi = {
  preview: (text: string, idempotencyKey?: string) =>
    apiFetch<ActionPlanDetail>("/api/v1/instructions/preview", {
      method: "POST",
      body: JSON.stringify({ text, ...(idempotencyKey ? { idempotencyKey } : {}) }),
    }),

  confirm: (id: string) =>
    apiFetch<ConfirmResponse>(`/api/v1/action-plans/${id}/confirm`, {
      method: "POST",
    }),

  list: () =>
    apiFetch<ActionPlanSummary[]>("/api/v1/action-plans"),

  get: (id: string) =>
    apiFetch<ActionPlanDetail>(`/api/v1/action-plans/${id}`),
};

// ── Integration types ────────────────────────────────────────────────────────

export type IntegrationProvider =
  | "GOOGLE_CALENDAR"
  | "GMAIL"
  | "OUTLOOK_CALENDAR"
  | "OUTLOOK_MAIL"
  | "HUBSPOT"
  | "SLACK"
  | "NOTION"
  | "INTERNAL_TASKS";

export type IntegrationStatus = "DISCONNECTED" | "CONNECTED" | "ERROR";

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  displayName: string;
  lastError: string | null;
}

// ── Integration endpoints ────────────────────────────────────────────────────

export const integrationsApi = {
  list: () =>
    apiFetch<Integration[]>("/api/v1/integrations"),

  connect: (
    provider: IntegrationProvider,
    body: { displayName?: string; credentials?: Record<string, unknown> } = {}
  ) =>
    apiFetch<Integration>(`/api/v1/integrations/${provider}/connect`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  disconnect: (provider: IntegrationProvider) =>
    apiFetch<null>(`/api/v1/integrations/${provider}/disconnect`, {
      method: "DELETE",
    }),
};

// ── Settings types ───────────────────────────────────────────────────────────

export interface EngineSettings {
  tenantDefaultEngine: ExecutionEngineType | null;
  userEngineOverride: ExecutionEngineType | null;
  effectiveEngine: ExecutionEngineType;
}

// ── Settings endpoints ───────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    apiFetch<EngineSettings>("/api/v1/settings"),

  setTenantDefault: (defaultEngineType: ExecutionEngineType) =>
    apiFetch<EngineSettings>("/api/v1/settings/tenant-default-engine", {
      method: "PATCH",
      body: JSON.stringify({ defaultEngineType }),
    }),

  setUserOverride: (engineOverride: ExecutionEngineType | null) =>
    apiFetch<EngineSettings>("/api/v1/settings/my-engine-override", {
      method: "PATCH",
      body: JSON.stringify({ engineOverride }),
    }),
};

// ── Task types ───────────────────────────────────────────────────────────────

export const tasksApi = {
  list: () =>
    apiFetch<Task[]>("/api/v1/tasks"),

  get: (id: string) =>
    apiFetch<Task>(`/api/v1/tasks/${id}`),

  create: (body: CreateTaskInput) =>
    apiFetch<Task>("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: UpdateTaskInput) =>
    apiFetch<Task>(`/api/v1/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
