import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchSettings, updateSettings } from "../api/tasks";

export default function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [interval, setInterval] = useState<number | null>(null);
  const [concurrency, setConcurrency] = useState<number | null>(null);
  const mutation = useMutation({ mutationFn: updateSettings, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }) });
  if (isLoading || !settings) return <div style={{ color: "var(--text-muted)" }}>{t("settings.loading")}</div>;
  return (
    <div className="max-w-lg">
      <div
        className="card-glow rounded-2xl p-6 space-y-6 border transition-colors duration-300"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
      >
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{t("settings.fetchInterval")}</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="border rounded-lg px-3 py-2 flex-1"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              value={interval ?? settings.fetch_interval_minutes}
              onChange={(e) => setInterval(Number(e.target.value))}
            />
            <button
              onClick={() => { if (interval) mutation.mutate({ fetch_interval_minutes: interval }); }}
              className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("common.save")}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{t("settings.maxConcurrent")}</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={10}
              className="border rounded-lg px-3 py-2 flex-1"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              value={concurrency ?? settings.max_concurrent_fetches}
              onChange={(e) => setConcurrency(Number(e.target.value))}
            />
            <button
              onClick={() => { if (concurrency) mutation.mutate({ max_concurrent_fetches: concurrency }); }}
              className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("common.save")}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{t("settings.dataDirectory")}</label>
          <div
            className="text-sm rounded-lg px-3 py-2"
            style={{ color: "var(--text-muted)", background: "var(--bg-primary)" }}
          >
            {settings.data_dir}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{t("settings.cookiesDirectory")}</label>
          <div
            className="text-sm rounded-lg px-3 py-2"
            style={{ color: "var(--text-muted)", background: "var(--bg-primary)" }}
          >
            {settings.cookies_dir}
          </div>
        </div>
      </div>
    </div>
  );
}
