"use server";

import { validarPin, crearSesion } from "@/lib/auth";

export async function loginActionServer(pin: string) {
  const res = await validarPin(pin);

  if (res.ok) {
    await crearSesion();
    return { ok: true };
  }

  // devolver información útil para el cliente
  return {
    ok: false,
    error: res.error ?? "UNKNOWN",
    intentos_fallidos: (res as any).intentos_fallidos ?? 0,
    bloqueado_hasta: (res as any).bloqueado_hasta ?? null,
  };
}
