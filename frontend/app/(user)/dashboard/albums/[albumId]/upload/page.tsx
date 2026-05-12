import {UploadImageForm} from "@/components/UploadImageForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const statusTranslations: Record<string, string> = {
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
  APPROVED: "Aprobado",
};

interface UploadPageProps {
  params: Promise<{ albumId: string }>;
}

export default async function AlbumUploadPage({ params }: UploadPageProps) {
  const { albumId } = await params;
  
  const album = await prisma.album.findUnique({
    where: { id: albumId }
  });

  if (!album) {
    notFound();
  }

  if (album.status !== "APPROVED") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Álbum no aprobado</AlertTitle>
          <AlertDescription>
            No puedes subir imágenes a este álbum porque su estado actual es <span className="font-semibold lowercase">{statusTranslations[album.status] || album.status}</span>. Solo se permiten subidas en álbumes aprobados.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subir Imagenes al Album</h1>
        <p className="text-muted-foreground mt-1">
          Arrastra, suelta y organiza tus imagenes para analizar esteganografia.
        </p>
      </div>
      <UploadImageForm albumId={albumId} />
    </div>
  );
}
