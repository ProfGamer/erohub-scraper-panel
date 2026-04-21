import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createGroup } from "../api/groups";

export default function GroupForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      onClose();
    },
  });

  return (
    <div
      className="card-glow rounded-2xl p-6 mb-4 border transition-colors duration-300"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
    >
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("groups.form.title")}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name, description: description || undefined });
        }}
      >
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("groups.form.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("groups.form.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("groups.form.create")}
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
      </form>
    </div>
  );
}
