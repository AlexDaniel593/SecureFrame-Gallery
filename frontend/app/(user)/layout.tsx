import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";
import { isSupervisorRole, getRoleBasedPath } from "@/lib/route-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role: string })?.role as "USER" | "SUPERVISOR" | "ADMIN";

  if (isSupervisorRole(role)) {
    redirect(getRoleBasedPath(role));
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold">SecureFrame</h2>
          <p className="text-sm text-muted-foreground">Gallery</p>
        </div>
        <nav className="space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/albums">
            <Button variant="ghost" className="w-full justify-start">
              Mis Álbumes
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