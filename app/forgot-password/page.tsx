"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/50 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
              <Mail className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Password reset email sent
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, you will
              receive an email with instructions to reset your password.
            </p>
          </div>

          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {"Didn't receive the email? "}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="font-medium text-foreground hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending instructions...
            </>
          ) : (
            "Send reset instructions"
          )}
        </Button>

        <Button variant="outline" className="w-full bg-transparent" asChild>
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </Button>
      </form>
    </AuthLayout>
  );
}
