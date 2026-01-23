"use client";

import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import StepIndicator from "@/components/onboarding/step-indicator";
import { cn } from "@/lib/utils";

interface UseCaseScreenProps {
  selectedUseCase: string;
  onSelect: (useCase: string) => void;
  onContinue: () => void;
}

const useCases = [
  {
    id: "follow-ups",
    label: "Follow-ups after meetings",
    recommended: true,
  },
  {
    id: "tasks",
    label: "Tasks & reminders",
    recommended: false,
  },
  {
    id: "calendar",
    label: "Calendar scheduling",
    recommended: false,
  },
];

export default function UseCaseScreen({
  selectedUseCase,
  onSelect,
  onContinue,
}: UseCaseScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={2} totalSteps={3} />

        {/* Content */}
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl text-balance">
            What should we help you with first?
          </h2>
        </div>

        {/* Use Case Options */}
        <div className="space-y-3">
          {useCases.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => onSelect(useCase.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                selectedUseCase === useCase.id
                  ? "border-foreground bg-muted/50"
                  : "border-border hover:border-foreground/20 hover:bg-muted/30"
              )}
            >
              {/* Radio Circle */}
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  selectedUseCase === useCase.id
                    ? "border-foreground"
                    : "border-muted-foreground/50"
                )}
              >
                {selectedUseCase === useCase.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{useCase.label}</span>
                {useCase.recommended && (
                  <span className="text-xs text-success">recommended</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
