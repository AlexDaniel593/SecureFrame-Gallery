"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import prisma from "../prisma";
import { auth } from "@/lib/auth";

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

export async function requestAlbum(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const privacy = formData.get("privacy") as string;

  if (!title || title.trim().length === 0) {
    return { error: "El título es requerido" };
  }

  if (title.length > 255) {
    return { error: "El título no puede exceder 255 caracteres" };
  }

  const sanitizedTitle = sanitizeInput(title.trim());
  const sanitizedDescription = description 
    ? sanitizeInput(description.trim()) 
    : null;

  try {
    const album = await prisma.album.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        privacy: privacy === "PUBLIC" ? "PUBLIC" : "PRIVATE",
        status: "PENDING",
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/supervisor/pending-albums");
    
    return { success: true, album };
  } catch {
    return { error: "Error al crear la solicitud de álbum" };
  }
}

export async function getUserAlbums() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  try {
    const albums = await prisma.album.findMany({
      where: { userId: session.user.id },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { albums };
  } catch {
    return { error: "Error al obtener álbumes" };
  }
}

export async function getPendingAlbums() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return { error: "No autorizado" };
  }

try {
    const albums = await prisma.album.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        privacy: true,
        status: true,
        createdAt: true,
        user: { select: { username: true, email: true } },
      },
    });

    return { albums: albums};
  } catch {
    return { error: "Error al obtener albums pendientes" };
  }
}

export async function approveAlbum(albumId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  try {
    await prisma.album.update({
      where: { id: albumId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/supervisor/pending-albums");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch {
    return { error: "Error al aprobar el álbum" };
  }
}

export async function rejectAlbum(albumId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "No autenticado" };
  }

  const role = (session.user as { role: string })?.role;
  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  try {
    await prisma.album.update({
      where: { id: albumId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/supervisor/pending-albums");
    
    return { success: true };
  } catch {
    return { error: "Error al rechazar el álbum" };
  }
}