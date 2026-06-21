export type PacienteField =
  | "dni"
  | "nombre_completo"
  | "sexo"
  | "fecha_nacimiento"
  | "telefono"
  | "email"
  | "direccion"
  | "estado_civil"
  | "ocupacion"
  | "notas"

export type PacienteDataInput = {
  dni: string
  nombre_completo: string
  sexo?: string | null
  fecha_nacimiento?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  estado_civil?: string | null
  ocupacion?: string | null
  notas?: string | null
}

export type PacienteData = {
  dni: string
  nombre_completo: string
  sexo: string | null
  fecha_nacimiento: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  estado_civil: string | null
  ocupacion: string | null
  notas: string | null
}

export class PacienteValidationError extends Error {
  field: PacienteField

  constructor(field: PacienteField, message: string) {
    super(message)
    this.name = "PacienteValidationError"
    this.field = field
  }
}

export function normalizarDatosPaciente(input: PacienteDataInput): PacienteData {
  const dni = input.dni.replace(/\D/g, "")
  const nombreCompleto = input.nombre_completo.trim()
  const sexo = optional(input.sexo)?.toUpperCase() ?? null
  const fechaNacimiento = optional(input.fecha_nacimiento)
  const email = optional(input.email)

  if (!dni || dni.length < 6) {
    throw new PacienteValidationError("dni", "DNI inválido.")
  }
  if (!nombreCompleto) {
    throw new PacienteValidationError(
      "nombre_completo",
      "Nombre completo es obligatorio."
    )
  }
  if (sexo && !["M", "F"].includes(sexo)) {
    throw new PacienteValidationError("sexo", 'Sexo inválido. Usá "M" o "F".')
  }
  if (fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    throw new PacienteValidationError(
      "fecha_nacimiento",
      "Fecha de nacimiento inválida. Usá formato YYYY-MM-DD."
    )
  }
  if (email && !email.includes("@")) {
    throw new PacienteValidationError("email", "Email inválido.")
  }

  return {
    dni,
    nombre_completo: nombreCompleto,
    sexo,
    fecha_nacimiento: fechaNacimiento,
    telefono: optional(input.telefono),
    email,
    direccion: optional(input.direccion),
    estado_civil: optional(input.estado_civil),
    ocupacion: optional(input.ocupacion),
    notas: optional(input.notas),
  }
}

export function campoPacienteDesdeMensaje(message: string): PacienteField | null {
  const texto = message.toLowerCase()
  if (texto.includes("dni")) return "dni"
  if (texto.includes("nombre")) return "nombre_completo"
  if (texto.includes("sexo")) return "sexo"
  if (texto.includes("fecha")) return "fecha_nacimiento"
  if (texto.includes("email")) return "email"
  return null
}

function optional(value: string | null | undefined) {
  return value?.trim() || null
}
