"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users database
const mockUsers: Map<string, { user: User; password: string }> = new Map([
  [
    "demo@taskflow.com",
    {
      user: {
        id: "1",
        email: "demo@taskflow.com",
        name: "Max Mustermann",
        role: "user",
        emailVerified: true,
        createdAt: new Date("2024-01-01"),
        onboardingCompleted: false,
      },
      password: "demo123",
    },
  ],
  [
    "admin@taskflow.com",
    {
      user: {
        id: "2",
        email: "admin@taskflow.com",
        name: "Admin User",
        role: "admin",
        emailVerified: true,
        createdAt: new Date("2024-01-01"),
        onboardingCompleted: true,
      },
      password: "admin123",
    },
  ],
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (
      email: string,
      password: string,
      _remember: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 1000));

      const userData = mockUsers.get(email.toLowerCase());
      if (!userData || userData.password !== password) {
        setIsLoading(false);
        return { success: false, error: "Invalid email or password" };
      }

      if (!userData.user.emailVerified) {
        setIsLoading(false);
        return {
          success: false,
          error: "Please verify your email before logging in",
        };
      }

      setUser(userData.user);
      setIsLoading(false);
      return { success: true };
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
      await new Promise((r) => setTimeout(r, 1000));

      if (mockUsers.has(email.toLowerCase())) {
        setIsLoading(false);
        return { success: false, error: "An account with this email already exists" };
      }

      const newUser: User = {
        id: Math.random().toString(36).slice(2),
        email: email.toLowerCase(),
        name,
        role: "user",
        emailVerified: false,
        createdAt: new Date(),
        onboardingCompleted: false,
      };

      mockUsers.set(email.toLowerCase(), { user: newUser, password });
      setIsLoading(false);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const forgotPassword = useCallback(
    async (_email: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsLoading(false);
      // Always return success for security (don't reveal if email exists)
      return { success: true };
    },
    []
  );

  const resetPassword = useCallback(
    async (
      _token: string,
      _password: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsLoading(false);
      return { success: true };
    },
    []
  );

  const resendVerification = useCallback(
    async (_email: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsLoading(false);
      return { success: true };
    },
    []
  );

  const verifyEmail = useCallback(
    async (_token: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsLoading(false);
      return { success: true };
    },
    []
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const completeOnboarding = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
