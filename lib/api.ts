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

export interface PayloadFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  code: "VALIDATION" | "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL" | "CONFLICT";
  message: string;
  timestamp: string;
  errors?: PayloadFieldError[];
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
    throw Object.assign(new Error(err.message), { code: err.code, errors: err.errors });
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

// ── Tenant types ─────────────────────────────────────────────────────────────

export interface TenantDetail {
  id: string;
  name: string;
  role: TenantRole;
  createdAt: string;
}

export interface CreateTenantResponse {
  tenant: TenantDetail;
  session: AuthTokenResponse;
}

// ── Tenant endpoints ──────────────────────────────────────────────────────────

export const tenantsApi = {
  create: (name: string) =>
    apiFetch<CreateTenantResponse>("/api/v1/tenants", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};

// ── Member types ─────────────────────────────────────────────────────────────

export type MemberStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export interface MemberResponse {
  userId: string;
  name: string;
  email: string;
  role: TenantRole;
  status: MemberStatus;
  emailVerified: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
}

// ── Member endpoints ──────────────────────────────────────────────────────────

export const membersApi = {
  list: () =>
    apiFetch<MemberResponse[]>("/api/v1/tenants/me/members"),

  update: (userId: string, body: { role?: TenantRole; status?: "ACTIVE" | "SUSPENDED" }) =>
    apiFetch<MemberResponse>(`/api/v1/tenants/me/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  remove: (userId: string) =>
    apiFetch<null>(`/api/v1/tenants/me/members/${userId}`, {
      method: "DELETE",
    }),
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

// ── Pagination ───────────────────────────────────────────────────────────────

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ── Action plan types ────────────────────────────────────────────────────────

export type ActionPlanStatus =
  | "PENDING"
  | "DRAFT"
  | "CONFIRMED"
  | "EXECUTING"
  | "RUNNING"
  | "SUCCESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ActionType =
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "CREATE_CALENDAR_EVENT"
  | "RESCHEDULE_CALENDAR_EVENT"
  | "DRAFT_EMAIL"
  | "SEND_EMAIL"
  | "READ_EMAIL"
  | "TRIGGER_WORKFLOW"
  | "LOG_CRM_ACTIVITY"
  | "UPDATE_DEAL_STATUS"
  | "CREATE_FACEBOOK_POST"
  | "CREATE_LINKEDIN_POST"
  | "FETCH_AIRTABLE_RECORDS"
  | "CREATE_AIRTABLE_RECORD"
  | "SEARCH_AIRTABLE_RECORDS"
  | "LIST_AIRTABLE_BASES"
  | "LIST_AIRTABLE_TABLES";

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
  inputText: string;
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

// Per-action execution result returned by the confirm endpoint.
export interface ActionExecutionResult {
  index: number;
  status: "SUCCESS" | "FAILED";
  link: string | null;
  errorCode: string | null;
  messageUser: string | null;
  raw: Record<string, unknown> | null;
}

export interface ReadEmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface ReadEmailRaw {
  count: number;
  messages: ReadEmailMessage[];
}

export interface CreateCalendarEventRaw {
  eventId: string;
  title: string;
  htmlLink: string;
  newStartDateTime: string;
  newEndDateTime: string;
}

export interface RescheduleCalendarEventRaw {
  eventId: string;
  title: string;
  htmlLink: string;
  oldStartDateTime: string;
  newStartDateTime: string;
  newEndDateTime: string;
}

export interface ConfirmResponse {
  status: "SUCCESS" | "FAILED" | "EXECUTING";
  requestId?: string;
  actions?: ActionExecutionResult[];
}

// New shape returned by the confirm endpoint when execution is asynchronous.
export interface ConfirmInitiateResponse {
  status: "EXECUTING";
  requestId: string;
}

export interface ActionPayloadResponse {
  actionIndex: number;
  type: ActionType;
  provider: IntegrationProvider;
  riskLevel: RiskLevel;
  payload: Record<string, unknown>;
}

export interface ActionPlanActionDto {
  id: string;
  actionPlanId: string;
  actionIndex: number;
  actionType: ActionType;
  provider: IntegrationProvider;
  payload: Record<string, unknown>;
  riskLevel: RiskLevel;
  engineOverride: ExecutionEngineType | null;
}

export interface ActionRequest {
  actionType: ActionType;
  provider: IntegrationProvider;
  payload: Record<string, unknown>;
  riskLevel: RiskLevel;
  engineOverride?: ExecutionEngineType;
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

  updatePayload: (planId: string, actionIndex: number, payload: Record<string, string>) =>
    apiFetch<ActionPayloadResponse>(
      `/api/v1/action-plans/${planId}/actions/${actionIndex}/payload`,
      { method: "PATCH", body: JSON.stringify({ payload }) }
    ),

  list: (page = 0, size = 20) =>
    apiFetch<SpringPage<ActionPlanSummary>>(
      `/api/v1/action-plans?page=${page}&size=${size}&sort=createdAt,desc`
    ),

  get: (id: string) =>
    apiFetch<ActionPlanDetail>(`/api/v1/action-plans/${id}`),
};

// ── Execution result endpoint ─────────────────────────────────────────────────

// Imported lazily to avoid a circular-type dependency; the actual types live in types/execution.ts.
export const executionApi = {
  getLatest: (planId: string) =>
    apiFetch<import("@/types/execution").ExecutionRunResponse>(
      `/api/v1/action-plans/${planId}/executions/latest`
    ),
};

// ── Plan actions endpoints ────────────────────────────────────────────────────

export const planActionsApi = {
  list: (planId: string, page = 0, size = 50) =>
    apiFetch<SpringPage<ActionPlanActionDto>>(
      `/api/v1/action-plans/${planId}/actions?page=${page}&size=${size}&sort=actionIndex,asc`
    ),

  get: (planId: string, actionIndex: number) =>
    apiFetch<ActionPlanActionDto>(`/api/v1/action-plans/${planId}/actions/${actionIndex}`),

  create: (planId: string, body: ActionRequest) =>
    apiFetch<ActionPlanActionDto>(`/api/v1/action-plans/${planId}/actions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (planId: string, actionIndex: number, body: ActionRequest) =>
    apiFetch<ActionPlanActionDto>(`/api/v1/action-plans/${planId}/actions/${actionIndex}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (planId: string, actionIndex: number) =>
    apiFetch<null>(`/api/v1/action-plans/${planId}/actions/${actionIndex}`, {
      method: "DELETE",
    }),
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
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TWITTER"
  | "LINKEDIN"
  | "TIKTOK"
  | "AIRTABLE"
  | "INTERNAL_TASKS";

export type IntegrationStatus = "DISCONNECTED" | "CONNECTED" | "ERROR";

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  displayName: string;
  lastError: string | null;
}

export interface OAuthInitiateResponse {
  authorizationUrl: string;
}

// ── Integration endpoints ────────────────────────────────────────────────────

export const integrationsApi = {
  list: () =>
    apiFetch<Integration[]>("/api/v1/integrations"),

  initiateOAuth: (provider: IntegrationProvider) =>
    apiFetch<OAuthInitiateResponse>(`/api/v1/integrations/oauth/initiate/${provider}`),

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

// ── Airtable metadata endpoints ───────────────────────────────────────────────

export const airtableMetaApi = {
  getBases: () =>
    apiFetch<import("@/types/airtable").AirtableBasesResponse>("/api/v1/airtable/bases"),

  getTables: (baseId: string) =>
    apiFetch<import("@/types/airtable").AirtableTablesResponse>(
      `/api/v1/airtable/bases/${encodeURIComponent(baseId)}/tables`
    ),
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
