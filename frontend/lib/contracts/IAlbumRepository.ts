import { Status, Privacy } from "@prisma/client";

export type AlbumEntity = {
  id: string;
  title: string;
  description: string | null;
  privacy: Privacy;
  status: Status;
  userId: string;
  createdAt: Date;
};

export type CreateAlbumData = {
  title: string;
  description?: string;
  privacy?: Privacy;
};

export interface IAlbumRepository {
  findPending(): Promise<AlbumEntity[]>;
  findById(id: string): Promise<AlbumEntity | null>;
  updateStatus(id: string, status: Status): Promise<AlbumEntity>;
  findByUserId(userId: string): Promise<AlbumEntity[]>;
  create(userId: string, data: CreateAlbumData): Promise<AlbumEntity>;
}