"use client";

import { Button } from "@/components/ui/button";
import { Check, Shield, Globe, X } from "lucide-react";
import Logo from "@/components/logo";

interface WelcomeScreenProps {
  userName: string;
  onContinue: () => void;
}

export default function WelcomeScreen({ userName, onContinue }: WelcomeScreenProps) {
  const trustPoints = [
    { icon: Check, text: "No actions without approval" },
    { icon: Globe, text: "EU-hosted & GDPR-compliant" },
    { icon: X, text: "Cancel anytime" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-12">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Welcome Message */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl text-balance">
            Welcome, {userName}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Speak your tasks.<br />
            We take care of the rest — with full control.
          </p>
        </div>

        {/* Trust Points */}
        <div className="space-y-3">
          {trustPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
                <point.icon className="h-3 w-3 text-success" />
              </div>
              <span className="text-sm">{point.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          Start setup (5 minutes)
        </Button>
      </div>
    </div>
  );
}
