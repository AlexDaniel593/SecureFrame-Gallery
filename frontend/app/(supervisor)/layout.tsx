import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isSupervisorRole, getRoleBasedPath } from "@/lib/route-utils";
import { logoutAction } from "@/lib/actions";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role: string })?.role as "USER" | "SUPERVISOR" | "ADMIN";

  if (!isSupervisorRole(role)) {
    redirect(getRoleBasedPath(role));
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-orange-600">Supervisor</h2>
          <p className="text-sm text-muted-foreground">Panel de Control</p>
        </div>
        <nav className="space-y-2">
          <Link href="/supervisor/pending-albums">
            <Button variant="ghost" className="w-full justify-start">
              Álbumes Pendientes
            </Button>
          </Link>
          <Link href="/supervisor/quarantine">
            <Button variant="ghost" className="w-full justify-start">
              Imágenes en Cuarentena
            </Button>
          </Link>
        </nav>
        <div className="mt-6 pt-4 border-t">
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}