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
