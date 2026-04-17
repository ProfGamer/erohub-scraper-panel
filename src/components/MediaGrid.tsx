import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMedia, mediaFileUrl } from "../api/media";
import type { MediaItem } from "../types";
import MediaPreview from "./MediaPreview";

interface Props { type?: string; authorId?: string; groupId?: number; }

export default function MediaGrid({ type, authorId, groupId }: Props) {
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["media", { type, authorId, groupId, page }],
    queryFn: () => fetchMedia({ type, author_id: authorId, group_id: groupId, page, size: 24 }),
  });
  if (isLoading) return <div>Loading...</div>;
  if (!data || data.items.length === 0) return <div className="text-gray-500">No media found.</div>;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {data.items.map((m) => (
          <div key={m.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative" onClick={() => setPreview(m)}>
            {m.type === "video" && <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">VIDEO</div>}
            <img src={mediaFileUrl(m.id)} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      {data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Prev</button>
          <span className="px-4 py-2">{page} / {data.pages}</span>
          <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
      {preview && <MediaPreview media={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
