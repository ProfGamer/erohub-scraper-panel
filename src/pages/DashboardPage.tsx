import { useTranslation } from "react-i18next";
import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.dashboard.title")}</h1>
      <Dashboard />
    </div>
  );
}
