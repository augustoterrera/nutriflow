"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";

function limpiarNumeros(s: string) {
  return s.replace(/\D/g, "");
}

export async function crearPacienteAction(formData: FormData) {
  const dni = limpiarNumeros(String(formData.get("dni") ?? "")).trim();
  const nombre = String(formData.get("nombre_completo") ?? "").trim();

  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  const sexoRaw = String(formData.get("sexo") ?? "").trim().toUpperCase();
  const sexo = sexoRaw ? sexoRaw : null; // "M" | "F" | null

  const fechaNacimientoRaw = String(formData.get("fecha_nacimiento") ?? "").trim();
  const fecha_nacimiento = fechaNacimientoRaw ? fechaNacimientoRaw : null; // "YYYY-MM-DD" | null

  const email = String(formData.get("email") ?? "").trim() || null;
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const ocupacion = String(formData.get("ocupacion") ?? "").trim() || null;
  const estado_civil = String(formData.get("estado_civil") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!dni || dni.length < 6) {
    throw new Error("DNI inválido.");
  }
  if (!nombre) {
    throw new Error("Nombre completo es obligatorio.");
  }

  // Validación sexo
  if (sexo && !["M", "F"].includes(sexo)) {
    throw new Error('Sexo inválido. Usá "M" o "F".');
  }

  // Validación fecha (si viene)
  if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
    throw new Error("Fecha de nacimiento inválida. Usá formato YYYY-MM-DD.");
  }

  // Validación email (muy básica)
  if (email && !email.includes("@")) {
    throw new Error("Email inválido.");
  }

  const db = await getDB();

  try {
    const res = await db.run(
      `insert into pacientes (
         dni, nombre_completo, telefono, sexo, fecha_nacimiento,
         email, direccion, ocupacion, estado_civil, notas,
         actualizado_en
       ) values (
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         datetime('now')
       )`,
      [
        dni,
        nombre,
        telefono,
        sexo,
        fecha_nacimiento,
        email,
        direccion,
        ocupacion,
        estado_civil,
        notas,
      ]
    );

    const id = res.lastID as number;
    redirect(`/dashboard/pacientes/${id}`);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("UNIQUE") && msg.includes("pacientes.dni")) {
      throw new Error("Ya existe un paciente con ese DNI.");
    }
    throw e;
  }
}

