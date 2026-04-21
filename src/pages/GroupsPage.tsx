import { useState } from "react";
import { useTranslation } from "react-i18next";
import GroupForm from "../components/GroupForm";
import GroupList from "../components/GroupList";

export default function GroupsPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.groups.title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110"
          style={{ background: "var(--gradient-primary)" }}
        >
          {t("pages.groups.newGroup")}
        </button>
      </div>
      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
      <GroupList />
    </div>
  );
}
