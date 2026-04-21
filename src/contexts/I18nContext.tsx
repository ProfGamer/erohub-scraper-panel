import { createContext, useContext, useState, type ReactNode } from "react";
import i18n from "../i18n";

type Lang = "zh-CN" | "en";
const LANG_KEY = "erohub-lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(i18n.language as Lang);

  const setLang = (next: Lang) => {
    i18n.changeLanguage(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  };

  const toggleLang = () => setLang(lang === "zh-CN" ? "en" : "zh-CN");

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
