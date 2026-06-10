"use server";

import { setearPin } from "@/lib/auth";

export async function crearPinServer(pin: string, pin2: string) {
  if (pin !== pin2) return { ok: false, error: "NO_MATCH" };

  try {
    await setearPin(pin);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
