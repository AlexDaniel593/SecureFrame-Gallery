"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "");

async function getBackendToken(session: any) {
  return await new SignJWT({
    sub: session.user.id,
    role: session.user.role,
    email: session.user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(AUTH_SECRET);
}

/**
 * Aprueba una imagen en cuarentena.
 * Informa al backend de Python para que mueva el archivo a "limpias"
 * y luego actualiza el registro en la base de datos a APPROVED.
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

    const token = await getBackendToken(session);

    // Pedirle al backend de Python que apruebe y mueva la imagen en MinIO
    const res = await fetch(`${BACKEND_URL}/api/v1/quarantine/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ minio_path: image.minioPath }),
    });

    if (!res.ok) {
      throw new Error("El backend falló al mover la imagen en MinIO");
    }

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
 * Informa al backend de Python para eliminar físicamente de MinIO
 * y luego elimina su registro de la base de datos.
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

    const token = await getBackendToken(session);

    // Pedirle al backend de Python que elimine físicamente la imagen de MinIO
    const res = await fetch(`${BACKEND_URL}/api/v1/quarantine/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ minio_path: image.minioPath }),
    });

    if (!res.ok) {
      throw new Error("El backend falló al eliminar la imagen en MinIO");
    }

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
