"use server";

import { redirect } from "next/navigation";
import { cerrarSesion } from "@/lib/auth";

// Cerrar sesión es una mutación: va por POST (server action), nunca por GET.
// Un GET lo dispararía el prefetch de <Link> en producción y cerraría la
// sesión solo al navegar.
export async function logoutAction() {
  await cerrarSesion();
  redirect("/lock");
}
