"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";

type EditPacienteInput = {
  paciente_id: number;
  dni: string;
  nombre_completo: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado_civil: string | null;
  ocupacion: string | null;
  notas: string | null;
};

function limpiarNumeros(s: string) {
  return s.replace(/\D/g, "");
}

export async function editarPacienteAction(input: EditPacienteInput) {
  const dni = limpiarNumeros(input.dni);
  const nombre = input.nombre_completo.trim();

  if (!Number.isFinite(input.paciente_id) || input.paciente_id <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  if (!dni || dni.length < 6) {
    throw new Error("DNI inválido.");
  }

  if (!nombre) {
    throw new Error("Nombre completo es obligatorio.");
  }

  // Validación sexo
  const sexo = input.sexo?.trim() || null;
  if (sexo && !["M", "F"].includes(sexo)) {
    throw new Error('Sexo inválido. Usá "M" o "F".');
  }

  // Validación fecha
  const fecha_nacimiento = input.fecha_nacimiento?.trim() || null;
  if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
    throw new Error("Fecha de nacimiento inválida. Usá formato YYYY-MM-DD.");
  }

  // Validación email
  const email = input.email?.trim() || null;
  if (email && !email.includes("@")) {
    throw new Error("Email inválido.");
  }

  const db = await getDB();

  try {
    // Primero verificar que el paciente existe
    const paciente = await db.get(
      "SELECT id FROM pacientes WHERE id = ?",
      [input.paciente_id]
    );

    if (!paciente) {
      throw new Error("Paciente no encontrado.");
    }

    // Actualizar el paciente
    await db.run(
      `UPDATE pacientes SET
         dni = ?,
         nombre_completo = ?,
         sexo = ?,
         fecha_nacimiento = ?,
         telefono = ?,
         email = ?,
         direccion = ?,
         ocupacion = ?,
         estado_civil = ?,
         notas = ?,
         actualizado_en = datetime('now')
       WHERE id = ?`,
      [
        dni,
        nombre,
        sexo,
        fecha_nacimiento,
        input.telefono?.trim() || null,
        email,
        input.direccion?.trim() || null,
        input.ocupacion?.trim() || null,
        input.estado_civil?.trim() || null,
        input.notas?.trim() || null,
        input.paciente_id,
      ]
    );

    redirect(`/dashboard/pacientes/${input.paciente_id}`);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("UNIQUE") && msg.includes("pacientes.dni")) {
      throw new Error("Ya existe otro paciente con ese DNI.");
    }
    throw e;
  }
}

export async function obtenerPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();
  const paciente = await db.get(
    `SELECT 
       id, dni, nombre_completo, sexo, fecha_nacimiento,
       telefono, email, direccion, estado_civil, ocupacion, notas, activo
     FROM pacientes
     WHERE id = ?`,
    [pacienteId]
  );

  if (!paciente) {
    throw new Error("Paciente no encontrado.");
  }

  return paciente;
}
