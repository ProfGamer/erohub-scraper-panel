import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../api/tasks";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 10000,
  });

  if (isLoading || !stats) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Groups" value={stats.total_groups} />
      <StatCard label="Authors" value={stats.total_authors} />
      <StatCard label="Posts" value={stats.total_posts} />
      <StatCard label="Media Files" value={stats.total_media} />
    </div>
  );
}
