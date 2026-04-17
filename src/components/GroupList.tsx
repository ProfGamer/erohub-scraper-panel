import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteGroup, fetchGroups } from "../api/groups";
import type { Group } from "../types";

function GroupCard({ group }: { group: Group }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(group.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <Link to={`/groups/${group.id}`} className="flex-1">
        <div className="font-semibold text-lg">{group.name}</div>
        {group.description && <div className="text-sm text-gray-500">{group.description}</div>}
        <div className="text-sm text-gray-400 mt-1">{group.author_count} author{group.author_count !== 1 ? "s" : ""}</div>
      </Link>
      <button onClick={() => deleteMutation.mutate()} className="text-red-500 hover:text-red-700 ml-4">Delete</button>
    </div>
  );
}

export default function GroupList() {
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="space-y-3">
      {groups?.map((g) => <GroupCard key={g.id} group={g} />)}
      {groups?.length === 0 && <div className="text-gray-500">No groups yet.</div>}
    </div>
  );
}
