import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PendingAlbumsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role: string })?.role;

  if (role !== "SUPERVISOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}