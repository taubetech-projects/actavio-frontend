"use client";

import React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(
      formData.email,
      formData.password,
      formData.remember
    );
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || t("auth.login.errors.invalidCredentials"));
    }
  };

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="current-password"
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={formData.remember}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, remember: checked === true })
            }
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            {t("auth.login.rememberMe")}
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            {t("auth.login.signupLink")}
          </Link>
        </p>

      </form>
    </AuthLayout>
  );
}
