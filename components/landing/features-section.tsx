"use client";

import { Mic, Eye, HelpCircle, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function FeaturesSection() {
  const { t } = useI18n();

  const features = [
    {
      icon: Mic,
      titleKey: "landing.features.voiceInput.title" as const,
      descriptionKey: "landing.features.voiceInput.description" as const,
    },
    {
      icon: Eye,
      titleKey: "landing.features.preview.title" as const,
      descriptionKey: "landing.features.preview.description" as const,
    },
    {
      icon: HelpCircle,
      titleKey: "landing.features.explainability.title" as const,
      descriptionKey: "landing.features.explainability.description" as const,
    },
    {
      icon: Shield,
      titleKey: "landing.features.security.title" as const,
      descriptionKey: "landing.features.security.description" as const,
    },
  ];

  return (
    <section id="features" className="border-t border-border bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
