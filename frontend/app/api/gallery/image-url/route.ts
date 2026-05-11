import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * GET /api/gallery/image-url?path=<minioPath>
 *
 * Endpoint público que delega al backend la generación de una URL prefirmada
 * para imágenes del bucket clean-images.
 * No requiere autenticación.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minioPath = searchParams.get("path");

  if (!minioPath) {
    return NextResponse.json(
      { error: "Parámetro 'path' requerido" },
      { status: 400 }
    );
  }

  // Validación básica de path traversal
  if (minioPath.includes("..") || minioPath.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/gallery/presigned-url?path=${encodeURIComponent(minioPath)}`,
      {
        method: "GET",
        headers: {
          "X-Gallery-Public": "1",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Backend response ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Error requesting presigned URL from backend:", error);
    return NextResponse.json(
      { error: "Error al generar URL de imagen" },
      { status: 500 }
    );
  }
}
