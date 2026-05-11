import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT_PUBLIC || process.env.MINIO_ENDPOINT || "http://localhost:9000";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
const MINIO_BUCKET_QUARANTINE = process.env.MINIO_BUCKET_QUARANTINE || "quarantine";

function getEndpointUrl(): string {
  if (MINIO_ENDPOINT.startsWith("http://") || MINIO_ENDPOINT.startsWith("https://")) {
    return MINIO_ENDPOINT;
  }
  return `http://${MINIO_ENDPOINT}`;
}

/**
 * GET /api/quarantine/image-url?path=<minioPath>
 *
 * Genera una URL prefirmada de corta duración (5 min) para que el supervisor
 * pueda previsualizar una imagen almacenada en el bucket de cuarentena.
 * Solo accesible por usuarios con rol SUPERVISOR o ADMIN.
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

  // Sanitizar el path: no debe contener secuencias de path traversal
  if (minioPath.includes("..") || minioPath.startsWith("/")) {
    return NextResponse.json({ error: "Path inválido" }, { status: 400 });
  }

  try {
    const endpointUrl = getEndpointUrl();

    const s3Client = new S3Client({
      endpoint: endpointUrl,
      region: "us-east-1",
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET_QUARANTINE,
      Key: minioPath,
    });

    // URL prefirmada válida por 5 minutos
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Error generando URL prefirmada:", error);
    return NextResponse.json(
      { error: "Error al generar URL de imagen" },
      { status: 500 }
    );
  }
}
