import { compare } from "bcryptjs";
import { userRepository } from "../repositories";
import type {
  AuthResult,
  IAuthService,
  IUserRepository,
  LoginInput,
  RegisterInput,
} from "../contracts";

export class AuthService implements IAuthService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      const [emailExists, usernameExists] = await Promise.all([
        this.userRepository.existsByEmail(input.email),
        this.userRepository.existsByUsername(input.username),
      ]);

      if (emailExists) {
        return { success: false, error: "El correo ya esta registrado" };
      }

      if (usernameExists) {
        return { success: false, error: "El nombre de usuario ya esta en uso" };
      }

      const user = await this.userRepository.create({
        email: input.email,
        username: input.username,
        password: input.password,
        role: "USER",
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch {
      return { success: false, error: "Error al registrar usuario" };
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const user = await this.userRepository.findByEmail(input.email);

      if (!user) {
        return { success: false, error: "Credenciales invalidas" };
      }

      const isValid = await this.validatePassword(input.password, user.password);

      if (!isValid) {
        return { success: false, error: "Credenciales invalidas" };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch {
      return { success: false, error: "Error al iniciar sesion" };
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return compare(plainPassword, hashedPassword);
  }
}

const globalForAuthService = globalThis as unknown as {
  authService: AuthService | undefined;
};

export const authService =
  globalForAuthService.authService ?? new AuthService(userRepository);

if (process.env.NODE_ENV !== "production") {
  globalForAuthService.authService = authService;
}