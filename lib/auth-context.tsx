"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { authApi, tokenStore, type AuthTokenResponse, type TenantSummary } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  onboardingCompleted: boolean;
  activeTenantId: string | null;
  tenants: TenantSummary[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string; requiresTenantSetup?: boolean }>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REFRESH_TOKEN_KEY = "actavio_refresh_token";
const USER_NAME_KEY = "actavio_user_name";
const PENDING_NAME_KEY = "actavio_pending_name";
const ONBOARDING_KEY = "actavio_onboarding_done";

function buildUser(res: AuthTokenResponse, name: string): User {
  const activeTenant = res.tenants.find((t) => t.id === res.activeTenantId);
  const onboardingDone =
    localStorage.getItem(ONBOARDING_KEY) === "true" || !res.requiresTenantSetup;

  return {
    id: res.user.id,
    email: res.user.email,
    name,
    role: activeTenant?.role === "TENANT_ADMIN" ? "admin" : "user",
    emailVerified: res.user.emailVerified,
    createdAt: new Date(),
    onboardingCompleted: onboardingDone,
    activeTenantId: res.activeTenantId,
    tenants: res.tenants,
  };
}

function storeTokens(res: AuthTokenResponse) {
  tokenStore.setAccessToken(res.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
}

function clearTokens() {
  tokenStore.setAccessToken(null);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Register the 401 auto-refresh handler once
  useEffect(() => {
    tokenStore.setRefreshHandler(async () => {
      const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!rt) return null;
      try {
        const res = await authApi.refresh(rt);
        storeTokens(res);
        const name = localStorage.getItem(USER_NAME_KEY) || res.user.email.split("@")[0];
        setUser(buildUser(res, name));
        return res.accessToken;
      } catch {
        clearTokens();
        setUser(null);
        return null;
      }
    });
  }, []);

  // Restore session from stored refresh token on mount
  useEffect(() => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!rt) {
      setInitialized(true);
      return;
    }
    authApi
      .refresh(rt)
      .then((res) => {
        storeTokens(res);
        const name = localStorage.getItem(USER_NAME_KEY) || res.user.email.split("@")[0];
        setUser(buildUser(res, name));
      })
      .catch(() => clearTokens())
      .finally(() => setInitialized(true));
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      _remember: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const res = await authApi.login(email, password);
        storeTokens(res);
        const name = localStorage.getItem(USER_NAME_KEY) || email.split("@")[0];
        localStorage.setItem(USER_NAME_KEY, name);
        setUser(buildUser(res, name));
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Login failed" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        await authApi.signup({ name, email, password });
        localStorage.setItem(PENDING_NAME_KEY, name);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Signup failed" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    clearTokens();
    setUser(null);
    if (rt) {
      authApi.logout(rt).catch(() => undefined);
    }
  }, []);

  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        await authApi.forgotPassword(email);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Request failed" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (token: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        await authApi.resetPassword(token, password);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Reset failed" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resendVerification = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        await authApi.resendEmail(email);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to resend" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (
      token: string
    ): Promise<{ success: boolean; error?: string; requiresTenantSetup?: boolean }> => {
      setIsLoading(true);
      try {
        const res = await authApi.verifyEmail(token);
        storeTokens(res);
        const name =
          localStorage.getItem(PENDING_NAME_KEY) || res.user.email.split("@")[0];
        localStorage.setItem(USER_NAME_KEY, name);
        localStorage.removeItem(PENDING_NAME_KEY);
        setUser(buildUser(res, name));
        return { success: true, requiresTenantSetup: res.requiresTenantSetup };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Verification failed" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      if (updates.name) localStorage.setItem(USER_NAME_KEY, updates.name);
      return { ...prev, ...updates };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        initialized,
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        resendVerification,
        verifyEmail,
        updateUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
