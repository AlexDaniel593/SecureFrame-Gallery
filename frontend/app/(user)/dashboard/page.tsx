import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestAlbumForm } from "@/components/RequestAlbumForm";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </CardContent>
        </Card>
        <RequestAlbumForm />
      </div>
      <p className="text-muted-foreground">
        Aquí podrás gestionar tus álbumes y subir imágenes para análisis de esteganografía.
      </p>
      <Card>
        <CardContent className="pt-4">
          <a href="/dashboard/albums">
            <Button className="w-full md:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Subir Imágenes para Análisis
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}