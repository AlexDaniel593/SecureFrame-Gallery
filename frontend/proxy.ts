import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnSupervisor = req.nextUrl.pathname.startsWith("/supervisor");
  const isOnAuth = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

  const userRole = (req.auth?.user as { role?: string })?.role;

  if (isOnSupervisor) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    if (userRole !== "SUPERVISOR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/supervisor/:path*", "/login", "/register"],
};