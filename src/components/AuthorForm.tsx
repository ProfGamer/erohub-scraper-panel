import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createAuthor } from "../api/authors";
import { fetchGroups } from "../api/groups";

export default function AuthorForm({ onClose }: { onClose: () => void }) {
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
    <div className="bg-white rounded-xl shadow p-6 mb-4">
      <h3 className="font-semibold mb-4">Add Author</h3>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ username: username.replace("@", ""), group_id: groupId, display_name: displayName || undefined }); }}>
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Username (e.g. elonmusk)" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2 mb-3" value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">No group</option>
          {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
          <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
        </div>
        {mutation.isError && <div className="text-red-500 text-sm mt-2">Failed to add author. Username may already exist.</div>}
      </form>
    </div>
  );
}
