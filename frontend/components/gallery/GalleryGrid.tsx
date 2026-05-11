import { GalleryCard } from "@/components/gallery/GalleryCard";
import { EmptyState } from "@/components/EmptyState";

interface GalleryAlbum {
  id: string;
  title: string;
  description?: string | null;
  cleanImageCount: number;
  createdAt?: string | Date;
}

interface GalleryGridProps {
  albums: GalleryAlbum[];
}

export function GalleryGrid({ albums }: GalleryGridProps) {
  if (albums.length === 0) {
    return <EmptyState message="No hay álbumes públicos disponibles" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map((album) => (
        <GalleryCard key={album.id} album={album} />
      ))}
    </div>
  );
}
