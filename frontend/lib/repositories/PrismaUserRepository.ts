import { hash } from "bcryptjs";
import prisma from "../prisma";
import { IUserRepository, UserEntity, CreateUserData } from "../contracts";

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const hashedPassword = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role || "USER",
      },
    });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { email } });
    return !!user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { username } });
    return !!user;
  }
}