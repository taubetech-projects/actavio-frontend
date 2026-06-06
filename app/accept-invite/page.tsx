"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";
import { invitesApi } from "@/lib/api";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { loginWithTokens } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("No invite token found in this link.");
  }, [token]);

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Max 64 characters",      met: password.length <= 64 },
    { label: "Passwords match",        met: password.length > 0 && password === confirmPassword },
  ];

  const allMet = requirements.every((r) => r.met);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!allMet) {
      setError("Please meet all password requirements.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await invitesApi.accept(token, password);
      loginWithTokens(res);
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept invite. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid invite link" subtitle="This link is missing a token">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            The invite link is malformed. Ask your administrator to send a new invitation.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Welcome aboard!" subtitle="Your account is ready">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-success/30 bg-success/10 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Accept your invitation"
      subtitle="Set a password to activate your account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {(password || confirmPassword) && (
          <ul className="space-y-1">
            {requirements.map((req) => (
              <li
                key={req.label}
                className={`flex items-center gap-2 text-xs ${req.met ? "text-success" : "text-muted-foreground"}`}
              >
                <CheckCircle2 className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                {req.label}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !allMet}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activating account…</>
          ) : (
            "Accept invitation"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
