"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
const MINIO_BUCKET_QUARANTINE = process.env.MINIO_BUCKET_QUARANTINE || "quarantine";
const MINIO_BUCKET_CLEAN = process.env.MINIO_BUCKET_CLEAN || "clean-images";

function getEndpointUrl(): string {
  if (MINIO_ENDPOINT.startsWith("http://") || MINIO_ENDPOINT.startsWith("https://")) {
    return MINIO_ENDPOINT;
  }
  return `http://${MINIO_ENDPOINT}`;
}

const s3Client = new S3Client({
  endpoint: getEndpointUrl(),
  region: "us-east-1",
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

/**
 * Aprueba una imagen en cuarentena.
 * El supervisor ignora la alerta y la imagen se marca como APPROVED.
 * La imagen se mueve físicamente del bucket de cuarentena al bucket limpio.
 */
export async function approveQuarantinedImage(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  const imageId = formData.get("imageId") as string;
  if (!imageId) {
    return { error: "ID de imagen requerido" };
  }

  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, status: true, minioPath: true },
    });

    if (!image) {
      return { error: "Imagen no encontrada" };
    }

    if (image.status !== "QUARANTINED") {
      return { error: "La imagen no está en cuarentena" };
    }

    // Copiar la imagen al bucket de imágenes limpias
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: MINIO_BUCKET_CLEAN,
        CopySource: `${MINIO_BUCKET_QUARANTINE}/${image.minioPath}`,
        Key: image.minioPath,
      })
    );

    // Eliminar la imagen original del bucket de cuarentena
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: MINIO_BUCKET_QUARANTINE,
        Key: image.minioPath,
      })
    );

    await prisma.image.update({
      where: { id: imageId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/supervisor/quarantine");
    return { success: true };
  } catch {
    return { error: "Error al aprobar la imagen" };
  }
}

/**
 * Rechaza y elimina una imagen en cuarentena.
 * El supervisor confirma la alerta, la imagen se elimina físicamente de MinIO
 * y su registro se elimina de la base de datos.
 */
export async function rejectQuarantinedImage(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  const imageId = formData.get("imageId") as string;
  if (!imageId) {
    return { error: "ID de imagen requerido" };
  }

  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, status: true, minioPath: true },
    });

    if (!image) {
      return { error: "Imagen no encontrada" };
    }

    if (image.status !== "QUARANTINED") {
      return { error: "La imagen no está en cuarentena" };
    }

    // Eliminar la imagen físicamente del bucket de cuarentena
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: MINIO_BUCKET_QUARANTINE,
        Key: image.minioPath,
      })
    );

    // Eliminar el registro completamente de la base de datos
    await prisma.image.delete({
      where: { id: imageId },
    });

    revalidatePath("/supervisor/quarantine");
    return { success: true };
  } catch (error) {
    console.error("Error al rechazar imagen:", error);
    return { error: "Error al rechazar la imagen" };
  }
}
