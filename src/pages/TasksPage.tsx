import { useTranslation } from "react-i18next";
import TaskList from "../components/TaskList";

export default function TasksPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.tasks.title")}</h1>
      <TaskList />
    </div>
  );
}
