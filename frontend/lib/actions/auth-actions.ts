"use server";

import { redirect } from "next/navigation";
import { authService } from "../services/AuthService";
import { signIn } from "@/lib/auth";
import { getRoleBasedPath } from "@/lib/route-utils";

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !username || !password) {
    return { error: "Todos los campos son requeridos" };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return { error: "La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula, un número y un carácter especial" };
  }

  const result = await authService.register({ email, username, password });

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/login");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "El correo y la contraseña son requeridos" };
  }

  const result = await authService.login({ email, password });

  if (!result.success) {
    return { error: result.error };
  }

  const role = result.user?.role;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    return { error: "Error al iniciar sesión" };
  }

  if (role) {
      redirect(getRoleBasedPath(role));
    } else {
      redirect("/dashboard");
    }
}

export async function logoutAction() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirect: true, redirectTo: "/login" });
}