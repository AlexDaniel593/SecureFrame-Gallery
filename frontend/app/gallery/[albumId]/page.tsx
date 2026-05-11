import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicAlbum, logUnauthorizedAccess } from "@/lib/actions/gallery-actions";
import { AlbumDetailClient } from "./AlbumDetailClient";

interface Props {
  params: Promise<{ albumId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params;
  const album = await getPublicAlbum(albumId);

  if (!album) {
    return { title: "Álbum no encontrado" };
  }

  return {
    title: `${album.title} - SecureFrame Gallery`,
    description: album.description ?? `Álbum público: ${album.title}`,
  };
}

export default async function AlbumDetailPage({ params }: Props) {
  const { albumId } = await params;
  const album = await getPublicAlbum(albumId);

  if (!album) {
    // Log para auditoría
    await logUnauthorizedAccess(albumId, "Album not found or not APPROVED");
    notFound();
  }

  return <AlbumDetailClient album={album} />;
}
