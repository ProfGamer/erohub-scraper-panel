import { mediaFileUrl } from "../api/media";
import type { MediaItem } from "../types";

export default function MediaPreview({ media, onClose }: { media: MediaItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300">X</button>
        {media.type === "video" ? (
          <video src={mediaFileUrl(media.id)} controls autoPlay className="max-h-[85vh] rounded-lg" />
        ) : (
          <img src={mediaFileUrl(media.id)} alt="" className="max-h-[85vh] rounded-lg" />
        )}
      </div>
    </div>
  );
}
