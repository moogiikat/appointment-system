import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string })?.role;

  // Shop admin restrictions: redirect from home, my-reservations, and booking pages
  if (userRole === "shop_admin") {
    // Redirect from home page to shop-admin
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/shop-admin", req.url));
    }
    // Redirect from my-reservations to shop-admin
    if (pathname.startsWith("/my-reservations")) {
      return NextResponse.redirect(new URL("/shop-admin", req.url));
    }
    // Redirect from booking pages to shop-admin
    if (pathname.startsWith("/book")) {
      return NextResponse.redirect(new URL("/shop-admin", req.url));
    }
  }

  // Protected routes for shop admin
  if (pathname.startsWith("/shop-admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (userRole !== "shop_admin" && userRole !== "super_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protected routes for super admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (userRole !== "super_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protected routes for my-reservations (customers and super_admin only)
  if (pathname.startsWith("/my-reservations")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/shop-admin/:path*",
    "/admin/:path*",
    "/my-reservations/:path*",
    "/book/:path*",
  ],
};
