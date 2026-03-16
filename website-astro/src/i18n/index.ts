import enUI from "./ui/en.json";
import ptbrUI from "./ui/pt-br.json";

export type Locale = "pt-br" | "en";
export const defaultLocale: Locale = "pt-br";
export const locales: Locale[] = ["pt-br", "en"];

const uiStrings: Record<Locale, Record<string, string>> = {
  en: enUI,
  "pt-br": ptbrUI,
};

export function t(locale: Locale, key: string): string {
  return uiStrings[locale]?.[key] ?? uiStrings[defaultLocale]?.[key] ?? key;
}

export function useTranslations(locale: Locale) {
  return (key: string) => t(locale, key);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "en") return "en";
  return "pt-br";
}

export function getLocalePath(pathname: string, targetLocale: Locale): string {
  const currentLocale = getLocaleFromPath(pathname);
  let path = pathname;
  if (currentLocale === "en") {
    path = pathname.replace(/^\/en/, "") || "/";
  }
  if (targetLocale === "en") {
    return `/en${path}`;
  }
  return path;
}

export async function loadContent<T = Record<string, unknown>>(
  locale: Locale,
  contentPath: string
): Promise<T> {
  const modules = import.meta.glob<{ default: T }>("./content/**/*.json", {
    eager: true,
  });
  const key = `./content/${locale}/${contentPath}.json`;
  const mod = modules[key];
  if (!mod) {
    const fallbackKey = `./content/${defaultLocale}/${contentPath}.json`;
    const fallback = modules[fallbackKey];
    if (!fallback) throw new Error(`Content not found: ${contentPath} for locale ${locale}`);
    return fallback.default;
  }
  return mod.default;
}
