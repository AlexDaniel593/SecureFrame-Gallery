import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "");

/**
 * GET /api/quarantine/image-url?path=<minioPath>
 *
 * Delega al backend la generación de una URL prefirmada de MinIO.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const minioPath = searchParams.get("path");

  if (!minioPath) {
    return NextResponse.json({ error: "Parámetro 'path' requerido" }, { status: 400 });
  }

  try {
    const token = await new SignJWT({
      sub: session.user.id,
      role: role,
      email: session.user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(AUTH_SECRET);

    const res = await fetch(`${BACKEND_URL}/api/v1/quarantine/presigned-url?path=${encodeURIComponent(minioPath)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Backend response not ok");
    }

    const data = await res.json();
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Error pidiendo URL al backend:", error);
    return NextResponse.json(
      { error: "Error al generar URL de imagen" },
      { status: 500 }
    );
  }
}

