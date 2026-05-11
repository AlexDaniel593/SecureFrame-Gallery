"use server";

import prisma from "@/lib/prisma";

/**
 * Obtiene los álbumes aprobados con conteo de imágenes CLEAN.
 * NO requiere autenticación - es una acción pública.
 */
export async function getPublicAlbums() {
  try {
    const albums = await prisma.album.findMany({
      where: { status: "APPROVED", privacy: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            images: {
              where: { status: "CLEAN" },
            },
          },
        },
      },
    });

    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      createdAt: album.createdAt.toISOString(),
      cleanImageCount: album._count.images,
    }));
  } catch (error) {
    console.error("Error fetching public albums:", error);
    return [];
  }
}

/**
 * Obtiene un álbum público por ID con sus imágenes CLEAN.
 * Solo devuelve si el álbum está APPROVED.
 * NO requiere autenticación.
 */
export async function getPublicAlbum(albumId: string) {
  try {
    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        status: "APPROVED",
        privacy: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        images: {
          where: { status: "CLEAN" },
          orderBy: { id: "desc" },
          select: {
            id: true,
            filename: true,
            minioPath: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!album) {
      return null;
    }

    return {
      id: album.id,
      title: album.title,
      description: album.description,
      createdAt: album.createdAt.toISOString(),
      uploadedBy: album.user.username,
      images: album.images,
    };
  } catch (error) {
    console.error("Error fetching public album:", error);
    return null;
  }
}

/**
 * Registra intentos de acceso a álbumes no aprobados (para auditoría).
 */
export async function logUnauthorizedAccess(albumId: string, reason: string) {
  console.warn(
    `[SECURITY] Attempted access to non-public album ${albumId}: ${reason}`
  );
}
