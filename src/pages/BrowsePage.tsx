import { useState } from "react";
import FilterBar from "../components/FilterBar";
import MediaGrid from "../components/MediaGrid";

export default function BrowsePage() {
  const [filters, setFilters] = useState<{ type?: string; group_id?: number; author_id?: string }>({});
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browse</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      <MediaGrid type={filters.type} authorId={filters.author_id} groupId={filters.group_id} />
    </div>
  );
}
