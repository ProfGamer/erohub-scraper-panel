import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchAuthors } from "../api/authors";
import { fetchGroups } from "../api/groups";

interface Filters { type?: string; group_id?: number; author_id?: string; }

export default function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { t } = useTranslation();
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const { data: authors } = useQuery({ queryKey: ["authors"], queryFn: () => fetchAuthors() });
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        className="border rounded-lg px-3 py-2"
        style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
        value={filters.type ?? ""}
        onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}
      >
        <option value="">{t("filterBar.types.all")}</option>
        <option value="image">{t("filterBar.types.image")}</option>
        <option value="video">{t("filterBar.types.video")}</option>
        <option value="gif">{t("filterBar.types.gif")}</option>
      </select>
      <select
        className="border rounded-lg px-3 py-2"
        style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
        value={filters.group_id ?? ""}
        onChange={(e) => onChange({ ...filters, group_id: e.target.value ? Number(e.target.value) : undefined })}
      >
        <option value="">{t("filterBar.allGroups")}</option>
        {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <select
        className="border rounded-lg px-3 py-2"
        style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
        value={filters.author_id ?? ""}
        onChange={(e) => onChange({ ...filters, author_id: e.target.value || undefined })}
      >
        <option value="">{t("filterBar.allAuthors")}</option>
        {authors?.map((a) => <option key={a.id} value={a.id}>@{a.username}</option>)}
      </select>
    </div>
  );
}
