"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "@/lib/actions";
import { toast } from "sonner";

interface PasswordRequirements {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  function validatePassword(password: string) {
    setPasswordRequirements({
      minLength: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      toast.error("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula, un número y un carácter especial");
      toast.error("La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula, un número y un carácter especial");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerAction(formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
    } catch {
      setIsLoading(false);
    }

    setIsLoading(false);
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>Ingresa tus datos para registrarte en la plataforma</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="usuario123"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              onChange={(e) => validatePassword(e.target.value)}
              onFocus={() => setShowRequirements(true)}
              onBlur={() => setShowRequirements(false)}
            />
            {showRequirements && (
              <div className="space-y-1 mt-2">
                <p className={`text-xs ${passwordRequirements.minLength ? "text-green-600" : "text-red-500"}`}>
                  {passwordRequirements.minLength ? "✓" : "✗"} Mínimo 8 caracteres
                </p>
                <p className={`text-xs ${passwordRequirements.lowercase ? "text-green-600" : "text-red-500"}`}>
                  {passwordRequirements.lowercase ? "✓" : "✗"} Una letra minúscula
                </p>
                <p className={`text-xs ${passwordRequirements.uppercase ? "text-green-600" : "text-red-500"}`}>
                  {passwordRequirements.uppercase ? "✓" : "✗"} Una letra mayúscula
                </p>
                <p className={`text-xs ${passwordRequirements.number ? "text-green-600" : "text-red-500"}`}>
                  {passwordRequirements.number ? "✓" : "✗"} Un número
                </p>
                <p className={`text-xs ${passwordRequirements.special ? "text-green-600" : "text-red-500"}`}>
                  {passwordRequirements.special ? "✓" : "✗"} Un carácter especial
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          <Link
            href="/"
            className={`${buttonVariants({ variant: "outline" })} w-full border`}
          >
            Ir al inicio
          </Link>
          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}