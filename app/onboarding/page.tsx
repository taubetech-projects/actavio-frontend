"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WelcomeScreen from "@/components/onboarding/welcome-screen";
import ConnectToolScreen from "@/components/onboarding/connect-tool-screen";
import UseCaseScreen from "@/components/onboarding/use-case-screen";
import InputScreen from "@/components/onboarding/input-screen";
import PreviewScreen from "@/components/onboarding/preview-screen";
import SuccessScreen from "@/components/onboarding/success-screen";
import { useAuth } from "@/lib/auth-context";
import { tenantsApi } from "@/lib/api";

export type OnboardingStep =
  | "welcome"
  | "connect"
  | "usecase"
  | "input"
  | "preview"
  | "success";

export interface TaskData {
  rawInput: string;
  taskTitle: string;
  dueDate: string;
  reminderMinutes: number;
  emailDraftEnabled: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, initialized, loginWithTokens } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [orgName, setOrgName] = useState("");
  const [connectedTool, setConnectedTool] = useState<string | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<string>("follow-ups");
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [taskData, setTaskData] = useState<TaskData>({
    rawInput: "",
    taskTitle: "Follow up Müller GmbH",
    dueDate: "Tue, 24 Jan",
    reminderMinutes: 10,
    emailDraftEnabled: true,
  });

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push("/login");
    } else if (user.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [user, initialized, router]);

  if (!initialized || !user) {
    return null;
  }

  const goToStep = (step: OnboardingStep) => setCurrentStep(step);

  const handleOnboardingComplete = async () => {
    setCompletionError("");
    setIsCompletingOnboarding(true);
    try {
      const result = await tenantsApi.create(orgName || `${user!.name}'s Workspace`);
      loginWithTokens(result.session);
      // onboardingCompleted becomes true via requiresTenantSetup: false in the new session;
      // the useEffect guard above will redirect to /dashboard once user state updates.
    } catch (err: unknown) {
      setCompletionError(err instanceof Error ? err.message : "Failed to create workspace. Please try again.");
      setIsCompletingOnboarding(false);
    }
  };

  const userName = user.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-background">
      {currentStep === "welcome" && (
        <WelcomeScreen
          userName={userName}
          onContinue={(name) => { setOrgName(name); goToStep("connect"); }}
        />
      )}
      {currentStep === "connect" && (
        <ConnectToolScreen
          onConnect={(tool) => {
            setConnectedTool(tool);
            goToStep("usecase");
          }}
          onSkip={() => goToStep("usecase")}
        />
      )}
      {currentStep === "usecase" && (
        <UseCaseScreen
          selectedUseCase={selectedUseCase}
          onSelect={setSelectedUseCase}
          onContinue={() => goToStep("input")}
        />
      )}
      {currentStep === "input" && (
        <InputScreen
          onSubmit={(input) => {
            setTaskData({ ...taskData, rawInput: input });
            goToStep("preview");
          }}
        />
      )}
      {currentStep === "preview" && (
        <PreviewScreen
          taskData={taskData}
          onConfirm={() => goToStep("success")}
          onEdit={(updated) => setTaskData(updated)}
        />
      )}
      {currentStep === "success" && (
        <SuccessScreen
          taskData={taskData}
          onDoAnother={() => goToStep("input")}
          onViewTask={handleOnboardingComplete}
          isLoading={isCompletingOnboarding}
          error={completionError}
        />
      )}
    </main>
  );
}
