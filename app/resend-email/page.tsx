"use client";

import React from "react"

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";

function ResendEmailForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const { resendVerification, isLoading } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    const result = await resendVerification(email);
    if (result.success) {
      setSuccess(true);
      setCooldown(60);

      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <AuthLayout
      title="Resend verification email"
      subtitle="Enter your email to receive a new verification link"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">Email sent</p>
              <p className="text-sm text-muted-foreground">
                Check your inbox for the verification link.
              </p>
            </div>
          </div>
        )}

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

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || cooldown > 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            "Resend verification email"
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

export default function ResendEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResendEmailForm />
    </Suspense>
  );
}
