import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createAuthor } from "../api/authors";
import { fetchGroups } from "../api/groups";

export default function AuthorForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [groupId, setGroupId] = useState<number | undefined>();
  const [displayName, setDisplayName] = useState("");
  const queryClient = useQueryClient();
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const mutation = useMutation({
    mutationFn: createAuthor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["authors"] }); onClose(); },
  });

  return (
    <div
      className="card-glow rounded-2xl p-6 mb-4 border transition-colors duration-300"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
    >
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("authors.form.title")}</h3>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ username: username.replace("@", ""), group_id: groupId, display_name: displayName || undefined }); }}>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("authors.form.usernamePlaceholder")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("authors.form.displayNamePlaceholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <select
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          value={groupId ?? ""}
          onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">{t("authors.form.noGroup")}</option>
          {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("common.add")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
          >
            {t("common.cancel")}
          </button>
        </div>
        {mutation.isError && <div className="text-sm mt-2" style={{ color: "var(--badge-error-text)" }}>{t("authors.form.addFailed")}</div>}
      </form>
    </div>
  );
}
