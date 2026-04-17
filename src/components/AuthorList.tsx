import { useQuery } from "@tanstack/react-query";
import { fetchAuthors } from "../api/authors";
import AuthorCard from "./AuthorCard";

export default function AuthorList({ groupId }: { groupId?: number }) {
  const { data: authors, isLoading } = useQuery({ queryKey: ["authors", { groupId }], queryFn: () => fetchAuthors(groupId) });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {authors?.map((a) => <AuthorCard key={a.id} author={a} />)}
      {authors?.length === 0 && <div className="text-gray-500">No authors yet.</div>}
    </div>
  );
}
