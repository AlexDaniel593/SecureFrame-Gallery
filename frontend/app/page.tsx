import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoleBasedPath } from "@/lib/route-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await auth();

  if (session) {
    const role = (session.user as { role: string })?.role as "USER" | "SUPERVISOR" | "ADMIN";
    redirect(getRoleBasedPath(role));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            SecureFrame Gallery
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Plataforma segura de galería de imágenes con detección de esteganografía
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Visitar Galería</CardTitle>
              <CardDescription>Explora álbumes públicos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/albums"
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 w-full"
              >
                Ver Galería
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 w-full"
              >
                Iniciar Sesión
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="pt-8 border-t">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Las imágenes son analizadas automaticamente para detectar contenido oculto
          </p>
        </div>
      </div>
    </div>
  );
}