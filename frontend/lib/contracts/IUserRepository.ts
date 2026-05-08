import { Role } from "@/types";

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  role?: Role;
}

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  createdAt?: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}