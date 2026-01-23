"use client";

import Link from "next/link";
import Logo from "@/components/logo";
import { useI18n } from "@/lib/i18n-context";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {t("landing.features.security.description")}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8 lg:col-span-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("landing.footer.product")}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="#features"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("nav.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("nav.pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("nav.howItWorks")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("landing.footer.company")}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.about")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.blog")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.contact")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("landing.footer.legal")}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.imprint")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("landing.footer.gdpr")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TaskFlow. {t("landing.footer.copyright")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("landing.footer.madeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
