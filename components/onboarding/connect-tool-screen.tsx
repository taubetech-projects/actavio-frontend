"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Shield } from "lucide-react";
import Logo from "@/components/logo";
import StepIndicator from "@/components/onboarding/step-indicator";

interface ConnectToolScreenProps {
  onConnect: (tool: string) => void;
  onSkip: () => void;
}

export default function ConnectToolScreen({ onConnect, onSkip }: ConnectToolScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={1} totalSteps={3} />

        {/* Content */}
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl text-balance">
            Connect your calendar
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We only need this to create reminders.<br />
            Nothing is sent automatically.
          </p>
        </div>

        {/* Connect Button */}
        <div className="space-y-4">
          <Button
            onClick={() => onConnect("google-calendar")}
            variant="outline"
            size="lg"
            className="w-full h-14 justify-start gap-4 border-border hover:bg-muted/50 hover:border-foreground/20 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-foreground" />
            </div>
            <span className="font-medium">Connect Google Calendar</span>
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Read-only access. We never modify without approval.</span>
          </div>
        </div>

        {/* Skip Link */}
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
