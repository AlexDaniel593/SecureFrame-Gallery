import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { albumRepository } from "@/lib/repositories";

export default async function SupervisorDashboardPage() {
  const session = await auth();

  const pendingAlbums = await albumRepository.findPending();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Supervisor</h1>
      <div className="grid gap-6 md:grid-cols-3">
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
              Albums esperando aprobación
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
              <Button variant="outline" className="w-full">
                Ver Imágenes en Cuarentena
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
            así como gestionar imágenes en cuarentena detectadas por el sistema de análisis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}