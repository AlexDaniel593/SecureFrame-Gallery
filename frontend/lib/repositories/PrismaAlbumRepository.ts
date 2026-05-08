import prisma from "../prisma";
import { IAlbumRepository, AlbumEntity, CreateAlbumData } from "../contracts";
import { sanitizeXSS } from "../utils";

export class PrismaAlbumRepository implements IAlbumRepository {
  async findPending(): Promise<AlbumEntity[]> {
    const albums = await prisma.album.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      privacy: album.privacy,
      status: album.status,
      userId: album.userId,
      createdAt: album.createdAt,
    }));
  }

  async findById(id: string): Promise<AlbumEntity | null> {
    const album = await prisma.album.findUnique({
      where: { id },
    });
    if (!album) return null;
    return {
      id: album.id,
      title: album.title,
      description: album.description,
      privacy: album.privacy,
      status: album.status,
      userId: album.userId,
      createdAt: album.createdAt,
    };
  }

  async updateStatus(id: string, status: "APPROVED" | "REJECTED"): Promise<AlbumEntity> {
    const album = await prisma.album.update({
      where: { id },
      data: { status },
    });
    return {
      id: album.id,
      title: album.title,
      description: album.description,
      privacy: album.privacy,
      status: album.status,
      userId: album.userId,
      createdAt: album.createdAt,
    };
  }

  async findByUserId(userId: string): Promise<AlbumEntity[]> {
    const albums = await prisma.album.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      privacy: album.privacy,
      status: album.status,
      userId: album.userId,
      createdAt: album.createdAt,
    }));
  }

  async create(userId: string, data: CreateAlbumData): Promise<AlbumEntity> {
    const album = await prisma.album.create({
      data: {
        title: sanitizeXSS(data.title),
        description: data.description ? sanitizeXSS(data.description) : null,
        privacy: data.privacy || "PRIVATE",
        userId,
      },
    });
    return {
      id: album.id,
      title: album.title,
      description: album.description,
      privacy: album.privacy,
      status: album.status,
      userId: album.userId,
      createdAt: album.createdAt,
    };
  }
}

export const albumRepository = new PrismaAlbumRepository();