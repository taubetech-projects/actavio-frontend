"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Keyboard } from "lucide-react";
import Logo from "@/components/logo";
import StepIndicator from "@/components/onboarding/step-indicator";

interface InputScreenProps {
  onSubmit: (input: string) => void;
}

export default function InputScreen({ onSubmit }: InputScreenProps) {
  const [inputMode, setInputMode] = useState<"speak" | "type">("speak");
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const examplePrompt = "Remind me to follow up with Müller GmbH next Tuesday";

  const handleSpeak = () => {
    setIsRecording(true);
    // Simulate voice recognition
    setTimeout(() => {
      setIsRecording(false);
      onSubmit(examplePrompt);
    }, 2000);
  };

  const handleTypeSubmit = () => {
    if (textInput.trim()) {
      onSubmit(textInput);
    } else {
      onSubmit(examplePrompt);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={3} totalSteps={3} />

        {/* Content */}
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl text-balance">
            Try it now
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Speak or type:
          </p>
          <p className="text-sm text-muted-foreground/80 italic">
            {'"'}{examplePrompt}{'"'}
          </p>
        </div>

        {/* Input Area */}
        {inputMode === "speak" ? (
          <div className="space-y-6">
            {/* Microphone Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSpeak}
                disabled={isRecording}
                className={`
                  relative h-24 w-24 rounded-full transition-all
                  ${isRecording 
                    ? "bg-success text-success-foreground scale-110" 
                    : "bg-foreground text-background hover:scale-105"
                  }
                  flex items-center justify-center
                `}
              >
                <Mic className={`h-10 w-10 ${isRecording ? "animate-pulse" : ""}`} />
                {isRecording && (
                  <span className="absolute -bottom-8 text-sm text-muted-foreground">
                    Listening...
                  </span>
                )}
              </button>
            </div>

            {/* Speak Button */}
            <Button
              onClick={handleSpeak}
              disabled={isRecording}
              size="lg"
              className="w-full h-12 text-base font-medium gap-2"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? "Listening..." : "Speak"}
            </Button>

            {/* Switch to Type */}
            <div className="text-center">
              <button
                onClick={() => setInputMode("type")}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Keyboard className="h-4 w-4" />
                Type instead
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Text Input */}
            <Textarea
              placeholder={examplePrompt}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[120px] resize-none text-base"
            />

            {/* Submit Button */}
            <Button
              onClick={handleTypeSubmit}
              size="lg"
              className="w-full h-12 text-base font-medium"
            >
              Continue
            </Button>

            {/* Switch to Speak */}
            <div className="text-center">
              <button
                onClick={() => setInputMode("speak")}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mic className="h-4 w-4" />
                Speak instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
