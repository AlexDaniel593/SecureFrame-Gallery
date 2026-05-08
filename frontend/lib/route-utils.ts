import type { Role } from "@/types";

export function getRoleBasedPath(role: Role): string {
  if (role === "SUPERVISOR" || role === "ADMIN") {
    return "/supervisor";
  }
  return "/dashboard";
}

export function isSupervisorRole(role: Role): boolean {
  return role === "SUPERVISOR" || role === "ADMIN";
}