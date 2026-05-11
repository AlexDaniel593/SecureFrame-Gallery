import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuarantineImageCard } from "@/components/QuarantineImageCard";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function QuarantinePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") redirect("/dashboard");

  // Obtener imágenes en cuarentena con datos del álbum y usuario propietario
  const quarantinedImages = await prisma.image.findMany({
    where: { status: "QUARANTINED" },
    orderBy: { id: "desc" },
    select: {
      id: true,
      filename: true,
      minioPath: true,
      status: true,
      stegoResult: true,
      albumId: true,
      album: {
        select: {
          title: true,
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
            Imágenes en Cuarentena
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Imágenes marcadas automáticamente como sospechosas o maliciosas por
            el sistema de detección de esteganografía. Revisa los detalles del
            análisis antes de tomar una decisión.
          </p>
        </div>
        <Badge
          variant={quarantinedImages.length > 0 ? "destructive" : "secondary"}
          className="text-base px-3 py-1 self-start sm:self-auto"
        >
          {quarantinedImages.length}{" "}
          {quarantinedImages.length === 1 ? "imagen" : "imágenes"}
        </Badge>
      </div>

      {/* Panel de ayuda */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="py-3 px-4 text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p className="font-semibold">Guía de revisión:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>
              <strong>Aprobar (Ignorar alerta):</strong> La imagen se marca como
              aprobada y quedará disponible en la galería pública.
            </li>
            <li>
              <strong>Rechazar (Eliminar archivo):</strong> La imagen se marca
              como rechazada y no se mostrará al público.
            </li>
            <li>
              Haz clic en <strong>&quot;Ver Imagen&quot;</strong> para previsualizar
              el archivo antes de decidir.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Contenido */}
      {quarantinedImages.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-green-500 opacity-70" />
            <p className="text-lg font-medium">
              No hay imágenes en cuarentena
            </p>
            <p className="text-sm">
              Todas las imágenes han sido revisadas o no hay nuevas alertas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quarantinedImages.map((image) => (
            <QuarantineImageCard
              key={image.id}
              image={{
                ...image,
                stegoResult: image.stegoResult as Parameters<typeof QuarantineImageCard>[0]["image"]["stegoResult"],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
