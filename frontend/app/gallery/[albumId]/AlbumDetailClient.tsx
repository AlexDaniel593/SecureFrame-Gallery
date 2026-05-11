"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Image, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageGrid } from "@/components/ImageGrid";
import { EmptyState } from "@/components/EmptyState";

interface AlbumImage {
  id: string;
  filename: string;
  minioPath: string;
}

interface AlbumData {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  uploadedBy: string;
  images: AlbumImage[];
}

interface ImageWithUrl {
  id: string;
  filename: string;
  url: string;
}

interface Props {
  album: AlbumData;
}

export function AlbumDetailClient({ album }: Props) {
  const [imageUrls, setImageUrls] = useState<ImageWithUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImageUrls = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        album.images.map(async (img) => {
          const res = await fetch(
            `/api/gallery/image-url?path=${encodeURIComponent(img.minioPath)}`
          );
          const data = await res.json();
          return {
            id: img.id,
            filename: img.filename,
            url: data.url ?? "",
          };
        })
      );
      setImageUrls(results.filter((r) => r.url));
    } catch (error) {
      console.error("Error fetching image URLs:", error);
    } finally {
      setLoading(false);
    }
  }, [album.images]);

  useEffect(() => {
    if (album.images.length > 0) {
      fetchImageUrls();
    } else {
      setLoading(false);
    }
  }, [album.images, fetchImageUrls]);

  const formattedDate = new Date(album.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Back button */}
        <Link href="/gallery">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a la galería
          </Button>
        </Link>

        {/* Album header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{album.title}</h1>
          {album.description && (
            <p className="text-muted-foreground text-lg">{album.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {album.uploadedBy}
            </span>
            <span className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              {album.images.length}{" "}
              {album.images.length === 1 ? "imagen" : "imágenes"}
            </span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Images */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : imageUrls.length === 0 ? (
          <EmptyState message="Este álbum no tiene imágenes disponibles" />
        ) : (
          <ImageGrid images={imageUrls} />
        )}
      </div>
    </div>
  );
}