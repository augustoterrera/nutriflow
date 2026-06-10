import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";

const COOKIE_NAME = "nf_sesion";
const SESSION_HOURS = 12;

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function hayPinConfigurado() {
  const db = await getDB();
  const row = await db.get(
    `select pin_hash from configuracion_app where id = 1`,
  );
  return !!row?.pin_hash;
}

export async function setearPin(pin: string) {
  if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN inválido (4 a 6 dígitos).");

  const hash = await bcrypt.hash(pin, 10);
  const db = await getDB();

  await db.run(
    `update configuracion_app
     set pin_hash = ?,
         pin_creado_en = datetime('now'),
         intentos_fallidos = 0,
         bloqueado_hasta = null,
         actualizado_en = datetime('now')
     where id = 1`,
    [hash],
  );
}

export async function validarPin(pin: string) {
  const db = await getDB();
  const row = await db.get(
    `select pin_hash, bloqueado_hasta, intentos_fallidos
     from configuracion_app
     where id = 1`,
  );

  if (!row?.pin_hash)
    return { ok: false as const, error: "NO_PIN" as const, intentos_fallidos: 0 };

  // Bloqueo temporal por intentos
  if (row.bloqueado_hasta) {
    const until = new Date(row.bloqueado_hasta);
    if (Date.now() < until.getTime()) {
      return {
        ok: false as const,
        error: "BLOQUEADO" as const,
        intentos_fallidos: row.intentos_fallidos ?? 0,
        bloqueado_hasta: row.bloqueado_hasta ?? null,
      };
    }
  }

  const ok = await bcrypt.compare(pin, row.pin_hash);

  if (ok) {
    await db.run(
      `update configuracion_app
       set intentos_fallidos = 0,
           bloqueado_hasta = null,
           actualizado_en = datetime('now')
       where id = 1`,
    );
    return { ok: true as const };
  }

  const intentos = (row.intentos_fallidos ?? 0) + 1;

  // a los 5 intentos, bloquea 30s
  if (intentos >= 5) {
    const bloqueadoHasta = new Date(Date.now() + 30_000).toISOString();
    await db.run(
      `update configuracion_app
       set intentos_fallidos = ?,
           bloqueado_hasta = ?,
           actualizado_en = datetime('now')
       where id = 1`,
      [intentos, bloqueadoHasta],
    );
  } else {
    await db.run(
      `update configuracion_app
       set intentos_fallidos = ?,
           actualizado_en = datetime('now')
       where id = 1`,
      [intentos],
    );
  }

  // Leer la fila actualizada para devolver el conteo y bloqueo al cliente
  const actualizado = await db.get(
    `select intentos_fallidos, bloqueado_hasta from configuracion_app where id = 1`
  );

  return {
    ok: false as const,
    error: "PIN_INCORRECTO" as const,
    intentos_fallidos: actualizado?.intentos_fallidos ?? intentos,
    bloqueado_hasta: actualizado?.bloqueado_hasta ?? null,
  };
}

export async function crearSesion() {
  const token = crypto.randomBytes(32).toString("hex");
  const ahora = new Date();
  const expira = addHours(ahora, SESSION_HOURS);

  const instanciaId = await obtenerInstanciaId();

  const db = await getDB();
  await db.run(
    `insert into sesiones (token_sesion, expira_en, ultimo_uso_en, instancia_id)
     values (?, ?, datetime('now'), ?)`,
    [token, expira.toISOString(), instanciaId],
  );

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });

  return token;
}

export async function sesionValida() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const db = await getDB();

  const instanciaRow = await db.get(
    `select instancia_id from configuracion_app where id = 1`,
  );
  const instanciaActual = String(instanciaRow?.instancia_id ?? "");

  if (!instanciaActual) return false;

  const row = await db.get(
    `select id
     from sesiones
     where token_sesion = ?
       and cerrada_en is null
       and datetime(expira_en) > datetime('now')
       and instancia_id = ?`,
    [token, instanciaActual],
  );

  if (!row) return false;

  await db.run(
    `update sesiones set ultimo_uso_en = datetime('now') where token_sesion = ?`,
    [token],
  );

  return true;
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  const db = await getDB();
  await db.run(
    `update sesiones set cerrada_en = datetime('now') where token_sesion = ?`,
    [token],
  );

  cookieStore.delete(COOKIE_NAME);
}

async function obtenerInstanciaId() {
  const db = await getDB();

  // Asegura fila (por las dudas)
  await db.run(`insert or ignore into configuracion_app (id) values (1)`);

  const row = await db.get(
    `select instancia_id from configuracion_app where id = 1`,
  );

  // Si por algún motivo está null, la regeneramos
  if (!row?.instancia_id) {
    await db.run(
      `update configuracion_app
       set instancia_id = hex(randomblob(16)),
           actualizado_en = datetime('now')
       where id = 1`,
    );
    const row2 = await db.get(
      `select instancia_id from configuracion_app where id = 1`,
    );
    return String(row2?.instancia_id);
  }

  return String(row.instancia_id);
}
