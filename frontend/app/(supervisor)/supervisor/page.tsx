import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { albumRepository } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import { ShieldAlert } from "lucide-react";

export default async function SupervisorDashboardPage() {
  const session = await auth();

  const pendingAlbums = await albumRepository.findPending();

  const quarantineCount = await prisma.image.count({
    where: { status: "QUARANTINED" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Supervisor</h1>
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Álbumes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingAlbums.length}</p>
            <p className="text-xs text-muted-foreground">
              Álbumes esperando aprobación
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              En Cuarentena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${quarantineCount > 0 ? "text-orange-600 dark:text-orange-400" : ""}`}>
              {quarantineCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Imágenes pendientes de revisión
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/supervisor/pending-albums">
              <Button className="w-full">Ver Álbumes Pendientes</Button>
            </Link>
            <Link href="/supervisor/quarantine">
              <Button
                variant={quarantineCount > 0 ? "default" : "outline"}
                className={`w-full ${quarantineCount > 0 ? "bg-orange-600 hover:bg-orange-700" : ""}`}
              >
                Ver Imágenes en Cuarentena
                {quarantineCount > 0 && (
                  <span className="ml-2 rounded-full bg-white text-orange-600 text-xs font-bold px-1.5 py-0.5 leading-none">
                    {quarantineCount}
                  </span>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acerca del Panel de Supervisor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Como supervisor, puedes revisar y aprobar álbumes enviados por usuarios,
            así como gestionar imágenes en cuarentena detectadas por el sistema de análisis de esteganografía.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}