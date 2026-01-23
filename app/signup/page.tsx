"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    acceptTerms: false,
  });

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(formData.password),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.met);
    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    const result = await signup(
      formData.email,
      formData.password,
      formData.name
    );
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Signup failed");
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a verification link to your inbox"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-success/30 bg-success/10 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Verification email sent
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent an email to <strong>{formData.email}</strong>. Click the
              link in the email to verify your account.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {"Didn't receive the email? "}
            <Link
              href={`/resend-email?email=${encodeURIComponent(formData.email)}`}
              className="font-medium text-foreground hover:underline"
            >
              Click to resend
            </Link>
          </div>

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => router.push("/login")}
          >
            Back to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial. No credit card required."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Max Mustermann"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

          {/* Password requirements */}
          {formData.password && (
            <ul className="mt-2 space-y-1">
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
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, acceptTerms: checked === true })
            }
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
            I agree to the{" "}
            <Link href="#" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
