import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

const LANG_KEY = "erohub-lang";

function getInitialLang(): "zh-CN" | "en" {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "zh-CN" || stored === "en") return stored;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return "zh-CN";
}

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zh },
    en: { translation: en },
  },
  lng: getInitialLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  debug: import.meta.env.DEV,
});

export default i18n;
