import { getUserAlbums } from "@/lib/actions/album-actions";
import { AlbumsList } from "@/components/albums-list";

export default async function MyAlbumsPage() {
  const result = await getUserAlbums();

  if (result.error) {
    return (
      <div className="p-4 text-red-500">
        Error al cargar los albumes: {result.error}
      </div>
    );
  }

  const albums = result.albums || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mis Albumes</h1>
      <AlbumsList initialAlbums={albums} />
    </div>
  );
}
