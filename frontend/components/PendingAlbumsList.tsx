"use client";

import { approveAlbum, rejectAlbum } from "@/lib/actions/album-actions";
import { Button } from "@/components/ui/button";

interface PendingAlbum {
  id: string;
  title: string;
  description: string | null;
  privacy: string;
  status: string;
  createdAt: Date;
  user: {
    username: string;
    email: string;
  };
}

interface PendingAlbumsListProps {
  albums: PendingAlbum[];
}

export function PendingAlbumsList({ albums }: PendingAlbumsListProps) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay solicitudes pendientes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {albums.map((album) => (
        <div
          key={album.id}
          className="border rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{album.title}</h3>
              <p className="text-sm text-muted-foreground">
                Solicitado por: {album.user.username} ({album.user.email})
              </p>
              <p className="text-xs text-muted-foreground">
                Privacidad: {album.privacy === "PUBLIC" ? "Público" : "Privado"}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={async () => { await approveAlbum(album.id); }}>
                <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700">
                  Aprobar
                </Button>
              </form>
              <form action={async () => { await rejectAlbum(album.id); }}>
                <Button type="submit" variant="destructive">
                  Rechazar
                </Button>
              </form>
            </div>
          </div>
          {album.description && (
            <p className="text-sm text-muted-foreground border-t pt-2">
              {album.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}