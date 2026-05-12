import { albumRepository } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function approveAlbum(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await albumRepository.updateStatus(id, "APPROVED");
  revalidatePath("/supervisor/pending-albums");
}

async function rejectAlbum(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await albumRepository.updateStatus(id, "REJECTED");
  revalidatePath("/supervisor/pending-albums");
}

export default async function PendingAlbumsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") redirect("/dashboard");

  const albums = await albumRepository.findPending();

  const albumsWithUser = await Promise.all(
    albums.map(async (album) => {
      const user = await prisma.user.findUnique({
        where: { id: album.userId },
        select: { username: true, email: true },
      });
      return { ...album, username: user?.username, userEmail: user?.email };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Álbumes Pendientes</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba los álbumes enviados por usuarios
        </p>
      </div>

      {albumsWithUser.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay álbumes pendientes por revisar
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {albumsWithUser.map((album) => (
            <Card key={album.id}>
              <CardHeader>
                <CardTitle className="text-lg">{album.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Por: {album.username} ({album.userEmail})
                </p>
                <p className="text-xs text-muted-foreground">
                  Fecha: {album.createdAt.toLocaleDateString("es-ES")}
                </p>
              </CardHeader>
              <CardContent>
                {album.description && (
                  <p className="text-sm mb-4">{album.description}</p>
                )}
                <div className="flex gap-2">
                  <form action={approveAlbum}>
                    <input type="hidden" name="id" value={album.id} />
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Aprobar
                    </Button>
                  </form>
                  <form action={rejectAlbum}>
                    <input type="hidden" name="id" value={album.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Rechazar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}