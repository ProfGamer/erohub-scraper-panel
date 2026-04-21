import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthorForm from "../components/AuthorForm";
import AuthorList from "../components/AuthorList";

export default function AuthorsPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.authors.title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--gradient-primary)" }}
        >
          {t("pages.authors.addAuthor")}
        </button>
      </div>
      {showForm && <AuthorForm onClose={() => setShowForm(false)} />}
      <AuthorList />
    </div>
  );
}
