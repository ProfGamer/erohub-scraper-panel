import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createAuthor, fetchAuthors, updateAuthor } from "../api/authors";
import { fetchGroup, triggerGroupFetch, updateGroup } from "../api/groups";
import AuthorCard from "./AuthorCard";
import type { Author } from "../types";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function GroupDetail({ groupId }: { groupId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [showAssign, setShowAssign] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
  });

  const { data: groupAuthors } = useQuery({
    queryKey: ["authors", { groupId }],
    queryFn: () => fetchAuthors(groupId),
  });

  const { data: allAuthors } = useQuery({
    queryKey: ["authors"],
    queryFn: () => fetchAuthors(),
    enabled: showAssign,
  });

  const ungroupedAuthors = allAuthors?.filter((a) => !a.group_id) ?? [];

  const fetchMut = useMutation({ mutationFn: () => triggerGroupFetch(groupId) });

  const editMut = useMutation({
    mutationFn: () => updateGroup(groupId, { name: editName, description: editDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setEditing(false);
    },
  });

  const addAuthorMut = useMutation({
    mutationFn: () => createAuthor({ username: newUsername.replace("@", ""), group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setNewUsername("");
      setShowAddAuthor(false);
    },
  });

  const assignMut = useMutation({
    mutationFn: (authorId: string) => updateAuthor(authorId, { group_id: groupId } as Partial<Author>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (authorId: string) => updateAuthor(authorId, { group_id: null } as Partial<Author>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const startEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || "");
    setEditing(true);
  };

  if (isLoading || !group) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header card */}
      <div
        className="card-glow rounded-2xl p-5 border mb-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
      >
        {editing ? (
          <div className="space-y-3 mb-4">
            <input
              className="w-full border rounded-lg px-3 py-2 text-lg font-bold"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("groups.detail.groupName")}
            />
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder={t("groups.detail.descriptionPlaceholder")}
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => editMut.mutate()}
                disabled={editMut.isPending || !editName.trim()}
                className="btn-glow text-sm px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm px-4 py-1.5 rounded-lg border"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>{group.name}</h2>
                <button onClick={startEdit} className="flex-shrink-0 p-1 rounded transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              {group.description && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{group.description}</p>}
            </div>
            <button
              onClick={() => fetchMut.mutate()}
              disabled={fetchMut.isPending}
              className="btn-glow text-sm px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2 flex-shrink-0 ml-4"
              style={{ background: "var(--gradient-primary)" }}
            >
              {fetchMut.isPending && (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              )}
              {t("groups.detail.fetchAll")}
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 rounded-xl p-4" style={{ background: "var(--bg-primary)" }}>
          {[
            { label: t("groups.detail.stats.authors"), value: group.author_count },
            { label: t("groups.detail.stats.posts"), value: group.post_count },
            { label: t("groups.detail.stats.media"), value: group.media_count },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {fmtCount(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Author management toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("groups.detail.authors")}</h3>
        <div className="flex-1" />
        <button
          onClick={() => { setShowAssign((v) => !v); setShowAddAuthor(false); }}
          className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
          style={showAssign
            ? { background: "var(--gradient-primary)", borderColor: "transparent", color: "#fff" }
            : { borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-surface)" }
          }
        >
          {t("groups.detail.assignExisting")}
        </button>
        <button
          onClick={() => { setShowAddAuthor((v) => !v); setShowAssign(false); }}
          className="btn-glow text-sm px-3 py-1.5 rounded-lg text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          {t("groups.detail.newAuthor")}
        </button>
      </div>

      {/* Add new author form */}
      {showAddAuthor && (
        <div
          className="card-glow rounded-2xl p-4 mb-4 border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
        >
          <form
            className="flex items-center gap-3"
            onSubmit={(e) => { e.preventDefault(); if (newUsername.trim()) addAuthorMut.mutate(); }}
          >
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              placeholder={t("groups.detail.usernamePlaceholder")}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={addAuthorMut.isPending || !newUsername.trim()}
              className="btn-glow text-sm px-4 py-2 rounded-lg text-white disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              {addAuthorMut.isPending ? t("groups.detail.adding") : t("groups.detail.addToGroup")}
            </button>
          </form>
          {addAuthorMut.isError && (
            <div className="text-xs mt-2" style={{ color: "var(--badge-error-text)" }}>{t("groups.detail.addFailed")}</div>
          )}
        </div>
      )}

      {/* Assign existing ungrouped authors */}
      {showAssign && (
        <div
          className="card-glow rounded-2xl p-4 mb-4 border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
        >
          <div className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            {t("groups.detail.ungroupedHint")}
          </div>
          {ungroupedAuthors.length === 0 ? (
            <div className="text-sm py-2" style={{ color: "var(--text-muted)" }}>{t("groups.detail.noUngrouped")}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ungroupedAuthors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => assignMut.mutate(a.id)}
                  disabled={assignMut.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all hover:scale-[1.02]"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  {a.profile_image ? (
                    <img src={a.profile_image} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full text-[10px] text-white font-bold flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                      {(a.display_name || a.username)[0]}
                    </div>
                  )}
                  <span>@{a.username}</span>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14" /></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Author list with remove option */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupAuthors?.map((a) => (
          <div key={a.id} className="relative">
            <AuthorCard author={a} />
            <button
              onClick={() => removeMut.mutate(a.id)}
              disabled={removeMut.isPending}
              className="absolute top-3 right-3 p-1.5 rounded-lg transition-all hover:scale-110 z-10"
              style={{ background: "rgba(0,0,0,0.5)", color: "var(--badge-error-text)", backdropFilter: "blur(4px)" }}
              title={t("groups.detail.removeFromGroup")}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {groupAuthors?.length === 0 && (
          <div className="text-sm py-4" style={{ color: "var(--text-muted)" }}>{t("groups.detail.noAuthors")}</div>
        )}
      </div>
    </div>
  );
}
