"use client";

import { Button } from "@/components/ui/button";
import { Check, FileText, Bell, Calendar, Loader2 } from "lucide-react";
import Logo from "@/components/logo";
import type { TaskData } from "@/app/onboarding/page";

interface SuccessScreenProps {
  taskData: TaskData;
  onDoAnother: () => void;
  onViewTask: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function SuccessScreen({
  taskData,
  onDoAnother,
  onViewTask,
  isLoading = false,
  error,
}: SuccessScreenProps) {
  const completedItems = [
    { icon: FileText, text: "Task created" },
    { icon: Bell, text: "Reminder scheduled" },
    ...(taskData.emailDraftEnabled
      ? [{ icon: Calendar, text: "Email draft ready" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-success" />
            </div>
            <div className="absolute inset-0 rounded-full bg-success/5 animate-ping" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Done
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Your follow-up is prepared.
          </p>
        </div>

        {/* Completed Items */}
        <div className="space-y-3">
          {completedItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                <item.icon className="h-4 w-4 text-success" />
              </div>
              <span className="font-medium text-foreground">{item.text}</span>
              <Check className="h-4 w-4 text-success ml-auto" />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}
          <Button
            onClick={onViewTask}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up workspace…</>
            ) : (
              "Go to Dashboard"
            )}
          </Button>
          <Button
            onClick={onDoAnother}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base font-medium bg-transparent"
          >
            Create another task
          </Button>
        </div>
      </div>
    </div>
  );
}
