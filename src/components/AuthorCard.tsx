import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAuthor, triggerFetch, updateAuthor } from "../api/authors";
import type { Author } from "../types";

export default function AuthorCard({ author }: { author: Author }) {
  const queryClient = useQueryClient();
  const fetchMutation = useMutation({ mutationFn: () => triggerFetch(author.id) });
  const toggleMutation = useMutation({
    mutationFn: () => updateAuthor(author.id, { status: author.status === "active" ? "paused" : "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authors"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAuthor(author.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authors"] }),
  });
  const statusColor = author.status === "active" ? "bg-green-100 text-green-700" : author.status === "paused" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">{author.display_name?.[0] || author.username[0]}</div>
        <div className="flex-1">
          <div className="font-semibold">@{author.username}</div>
          {author.display_name && <div className="text-sm text-gray-500">{author.display_name}</div>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>{author.status}</span>
      </div>
      {author.last_fetched_at && <div className="text-xs text-gray-400 mb-3">Last fetched: {new Date(author.last_fetched_at).toLocaleString()}</div>}
      <div className="flex gap-2">
        <button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">{fetchMutation.isPending ? "Fetching..." : "Fetch Now"}</button>
        <button onClick={() => toggleMutation.mutate()} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200">{author.status === "active" ? "Pause" : "Resume"}</button>
        <button onClick={() => deleteMutation.mutate()} className="text-sm text-red-500 hover:text-red-700 ml-auto">Delete</button>
      </div>
    </div>
  );
}
