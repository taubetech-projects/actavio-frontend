"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n-context";

export default function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.features")}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.howItWorks")}
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.pricing")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                <span className="hidden sm:inline">{t("landing.hero.cta")}</span>
                <span className="sm:hidden">{t("nav.signup")}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-16 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
          <span className="flex h-2 w-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">
            {t("landing.features.security.title")}
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t("landing.hero.title")}
          <br />
          <span className="text-muted-foreground">{t("landing.hero.subtitle")}</span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {t("landing.hero.description")}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild className="px-8">
            <Link href="/signup">
              {t("landing.hero.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">{t("landing.hero.secondaryCta")}</Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm">{t("onboarding.welcome.features.control")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-success" />
            <span className="text-sm">{t("onboarding.welcome.features.preview")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm">{t("onboarding.welcome.features.privacy")}</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-muted-foreground/30 p-1.5">
          <div className="h-2 w-1 animate-bounce rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}
