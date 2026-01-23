"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n-context";

export function LanguageToggle() {
  const { language, setLanguage, languages } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
          >
            <span className="mr-2">{getFlagEmoji(lang.code)}</span>
            {lang.nativeName}
            {language === lang.code && (
              <span className="ml-auto text-success">•</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getFlagEmoji(code: string): string {
  const flags: Record<string, string> = {
    en: "🇬🇧",
    de: "🇩🇪",
    bn: "🇧🇩",
  };
  return flags[code] || "🌐";
}
