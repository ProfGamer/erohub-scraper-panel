import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createGroup } from "../api/groups";

export default function GroupForm({ onClose }: { onClose: () => void }) {
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
    <div className="bg-white rounded-xl shadow p-6 mb-4">
      <h3 className="font-semibold mb-4">New Group</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name, description: description || undefined });
        }}
      >
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button>
          <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  );
}
