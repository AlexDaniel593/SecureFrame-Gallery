import {UploadImageForm} from "@/components/UploadImageForm";

interface UploadPageProps {
  params: Promise<{ albumId: string }>;
}

export default async function AlbumUploadPage({ params }: UploadPageProps) {
  const { albumId } = await params;
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
