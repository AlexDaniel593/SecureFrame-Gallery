import { PrismaUserRepository } from "./PrismaUserRepository";

const globalForUserRepository = globalThis as unknown as {
  userRepository: PrismaUserRepository | undefined;
};

export const userRepository =
  globalForUserRepository.userRepository ?? new PrismaUserRepository();

if (process.env.NODE_ENV !== "production") {
  globalForUserRepository.userRepository = userRepository;
}