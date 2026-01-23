"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Language, type TranslationKey } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  languages: { code: Language; name: string; nativeName: string }[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export const availableLanguages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("language") as Language | null;
    if (stored && translations[stored]) {
      setLanguageState(stored);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split("-")[0] as Language;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          // Fallback to English
          value = translations.en;
          for (const fallbackKey of keys) {
            if (value && typeof value === "object" && fallbackKey in value) {
              value = (value as Record<string, unknown>)[fallbackKey];
            } else {
              return key; // Return key if not found
            }
          }
          break;
        }
      }

      if (typeof value !== "string") return key;

      // Replace parameters
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
          value
        );
      }

      return value;
    },
    [language]
  );

  if (!mounted) {
    return (
      <I18nContext.Provider
        value={{ language: "en", setLanguage, t, languages: availableLanguages }}
      >
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: availableLanguages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
