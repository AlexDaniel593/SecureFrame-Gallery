import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "");

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const albumId = formData.get("albumId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Archivo requerido" },
        { status: 400 }
      );
    }

    if (!albumId || typeof albumId !== "string") {
      return NextResponse.json(
        { error: "Album requerido" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
      select: { id: true },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album no encontrado" },
        { status: 404 }
      );
    }

    // Validar tipo MIME del lado del servidor
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no soportado. Usa JPEG, PNG, GIF, WebP o BMP." },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 10MB" },
        { status: 413 }
      );
    }

    // Crear un JWT simple firmado con AUTH_SECRET para el backend
    const token = await new SignJWT({
      sub: session.user.id,
      role: (session.user as { role: string }).role,
      email: session.user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(AUTH_SECRET);

    // Construir FormData para reenviar al backend
    const backendFormData = new FormData();
    backendFormData.append("file", file, file.name);

    // Enviar al backend con el token JWT
    const response = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.detail || errorData.error || "Error al analizar la imagen",
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result?.verdict === "CLEAN") {
      const minioPath = result?.minio_path ?? result?.minioPath;
      if (!minioPath || typeof minioPath !== "string") {
        return NextResponse.json(
          { error: "Resultado invalido del analizador" },
          { status: 500 }
        );
      }

      const image = await prisma.image.create({
        data: {
          filename: result.filename ?? file.name,
          minioPath,
          status: "CLEAN",
          stegoResult: result,
          albumId,
        },
        select: { id: true },
      });

      return NextResponse.json({ ...result, saved: true, imageId: image.id });
    }

    // Guardar imágenes SUSPICIOUS o MALICIOUS en cuarentena para revisión manual
    if (result?.verdict === "SUSPICIOUS" || result?.verdict === "MALICIOUS") {
      const minioPath = result?.minio_path ?? result?.minioPath;
      if (minioPath && typeof minioPath === "string") {
        const image = await prisma.image.create({
          data: {
            filename: result.filename ?? file.name,
            minioPath,
            status: "QUARANTINED",
            stegoResult: result,
            albumId,
          },
          select: { id: true },
        });
        return NextResponse.json({
          ...result,
          saved: true,
          quarantined: true,
          imageId: image.id,
        });
      }
    }

    return NextResponse.json({ ...result, saved: false });
  } catch (error) {
    console.error("Error en upload proxy:", error);
    return NextResponse.json(
      { error: "Error de conexión con el servidor de análisis" },
      { status: 500 }
    );
  }
}