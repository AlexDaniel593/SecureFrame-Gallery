import type { Metadata } from "next";
import Link from "next/link";
import { getPublicAlbums } from "@/lib/actions/gallery-actions";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { buttonVariants } from "@/components/ui/button";
import { Image } from "lucide-react";

export const metadata: Metadata = {
  title: "Galería Pública - SecureFrame Gallery",
  description: "Explora álbumes públicos de imágenes verificadas como seguras",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await getPublicAlbums();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Link
            href="/"
            className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto border`}
          >
            Volver al inicio
          </Link>
          <Link
            href="/login"
            className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto border`}
          >
            Iniciar sesion
          </Link>
        </div>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Image className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Galería Pública</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explora álbumes de imágenes verificadas por nuestro sistema de
            detección de esteganografía. Todas las imágenes aquí mostradas han
            sido analizadas y marcadas como limpias.
          </p>
        </div>

        {/* Albums grid */}
        <GalleryGrid albums={albums} />
      </div>
    </div>
  );
}
