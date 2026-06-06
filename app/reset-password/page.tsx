"use client";

import React from "react"

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { resetPassword, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    authApi.verifyResetToken(token).then((res) => setTokenValid(res.valid)).catch(() => setTokenValid(false));
  }, [token]);

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(formData.password),
    },
    {
      label: "Passwords match",
      met:
        formData.password.length > 0 &&
        formData.password === formData.confirmPassword,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.met);
    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    const result = await resetPassword(token, formData.password);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Failed to reset password");
    }
  };

  if (tokenValid === null) {
    return (
      <AuthLayout title="Checking link..." subtitle="">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (tokenValid === false) {
    return (
      <AuthLayout title="Link expired" subtitle="This password reset link is no longer valid">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center gap-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground">
              The link may have expired or already been used. Request a new one.
            </p>
          </div>
          <Button className="w-full" onClick={() => router.push("/forgot-password")}>
            Request new reset link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password reset successful"
        subtitle="Your password has been changed"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-success/30 bg-success/10 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Password updated
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been successfully reset. You can now log in with
              your new password.
            </p>
          </div>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Continue to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Your new password must be different from previous passwords"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password requirements */}
        {(formData.password || formData.confirmPassword) && (
          <ul className="space-y-1">
            {passwordRequirements.map((req) => (
              <li
                key={req.label}
                className={`flex items-center gap-2 text-xs ${
                  req.met ? "text-success" : "text-muted-foreground"
                }`}
              >
                <CheckCircle2
                  className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`}
                />
                {req.label}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
