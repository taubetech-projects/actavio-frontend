"use client";

import { useI18n } from "@/lib/i18n-context";

export default function HowItWorksSection() {
  const { t } = useI18n();

  const steps = [
    {
      number: "01",
      titleKey: "landing.howItWorks.step1.title" as const,
      descriptionKey: "landing.howItWorks.step1.description" as const,
    },
    {
      number: "02",
      titleKey: "landing.howItWorks.step2.title" as const,
      descriptionKey: "landing.howItWorks.step2.description" as const,
    },
    {
      number: "03",
      titleKey: "landing.howItWorks.step3.title" as const,
      descriptionKey: "landing.howItWorks.step3.description" as const,
    },
  ];

  return (
    <section id="how-it-works" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 space-y-16 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-border lg:block" />
              )}

              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step number */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-2xl font-bold text-background">
                  {step.number}
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
