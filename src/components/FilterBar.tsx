import { useQuery } from "@tanstack/react-query";
import { fetchAuthors } from "../api/authors";
import { fetchGroups } from "../api/groups";

interface Filters { type?: string; group_id?: number; author_id?: string; }

export default function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const { data: authors } = useQuery({ queryKey: ["authors"], queryFn: () => fetchAuthors() });
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select className="border rounded-lg px-3 py-2" value={filters.type ?? ""} onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}>
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="gif">GIFs</option>
      </select>
      <select className="border rounded-lg px-3 py-2" value={filters.group_id ?? ""} onChange={(e) => onChange({ ...filters, group_id: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">All groups</option>
        {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <select className="border rounded-lg px-3 py-2" value={filters.author_id ?? ""} onChange={(e) => onChange({ ...filters, author_id: e.target.value || undefined })}>
        <option value="">All authors</option>
        {authors?.map((a) => <option key={a.id} value={a.id}>@{a.username}</option>)}
      </select>
    </div>
  );
}
