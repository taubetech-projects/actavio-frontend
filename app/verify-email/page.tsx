"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the link.");
      return;
    }

    verifyEmail(token).then((result) => {
      if (result.success) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Verification failed. The link may have expired.");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "loading") {
    return (
      <AuthLayout title="Verifying your email" subtitle="Please wait a moment...">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Confirming your email address...</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout title="Email verified" subtitle="You're all set">
        <div className="flex flex-col items-center justify-center rounded-lg border border-success/30 bg-success/10 p-8 text-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Email confirmed!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed" subtitle="We couldn't verify your email">
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center gap-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Link invalid or expired</h3>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
        <Button className="w-full" onClick={() => router.push("/resend-email")}>
          Request a new verification link
        </Button>
        <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/login")}>
          Back to login
        </Button>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
