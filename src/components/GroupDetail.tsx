import { useQuery } from "@tanstack/react-query";
import { fetchAuthors } from "../api/authors";
import { fetchGroup } from "../api/groups";
import AuthorCard from "./AuthorCard";

export default function GroupDetail({ groupId }: { groupId: number }) {
  const { data: group } = useQuery({ queryKey: ["groups", groupId], queryFn: () => fetchGroup(groupId) });
  const { data: authors } = useQuery({ queryKey: ["authors", { groupId }], queryFn: () => fetchAuthors(groupId) });
  if (!group) return <div>Loading...</div>;
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{group.name}</h2>
      {group.description && <p className="text-gray-500 mb-4">{group.description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors?.map((a) => <AuthorCard key={a.id} author={a} />)}
      </div>
      {authors?.length === 0 && <div className="text-gray-500">No authors in this group.</div>}
    </div>
  );
}
