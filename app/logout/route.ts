import { NextResponse } from "next/server";
import { cerrarSesion } from "@/lib/auth";

export async function GET() {
  await cerrarSesion();
  return NextResponse.redirect(new URL("/lock", "http://localhost:3000"));
}
