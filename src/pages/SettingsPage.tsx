import { useTranslation } from "react-i18next";
import Settings from "../components/Settings";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.settings.title")}</h1>
      <Settings />
    </div>
  );
}
