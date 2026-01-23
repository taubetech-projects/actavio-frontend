"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";

export default function CTASection() {
  const { t } = useI18n();

  return (
    <section className="bg-foreground py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mt-4 text-lg text-background/70">
            {t("landing.cta.subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="px-8"
            >
              <Link href="/signup">
                {t("landing.cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
