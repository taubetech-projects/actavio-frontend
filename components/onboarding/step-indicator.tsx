interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              index < currentStep ? "bg-foreground" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
