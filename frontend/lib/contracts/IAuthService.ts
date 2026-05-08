import { Role } from "@/types";

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    role: Role;
  };
}

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}