import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoleBasedPath } from "@/lib/route-utils";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    const role = (session.user as { role: string })?.role as "USER" | "SUPERVISOR" | "ADMIN";
    const redirectPath = getRoleBasedPath(role);
    redirect(redirectPath);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}