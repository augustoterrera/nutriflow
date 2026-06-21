import { describe, expect, it } from "vitest"

import {
  PacienteValidationError,
  campoPacienteDesdeMensaje,
  normalizarDatosPaciente,
} from "./pacientes"

const valido = {
  dni: "37.409.998",
  nombre_completo: "  Maricel Del Valle  ",
}

describe("datos del paciente", () => {
  it("normaliza campos obligatorios y opcionales", () => {
    expect(
      normalizarDatosPaciente({
        ...valido,
        sexo: " f ",
        telefono: " 3854440000 ",
        email: " persona@example.com ",
        direccion: "   ",
      })
    ).toMatchObject({
      dni: "37409998",
      nombre_completo: "Maricel Del Valle",
      sexo: "F",
      telefono: "3854440000",
      email: "persona@example.com",
      direccion: null,
    })
  })

  it.each([
    ["dni", { ...valido, dni: "123" }],
    ["nombre_completo", { ...valido, nombre_completo: " " }],
    ["sexo", { ...valido, sexo: "X" }],
    ["fecha_nacimiento", { ...valido, fecha_nacimiento: "18/04/1993" }],
    ["email", { ...valido, email: "correo-invalido" }],
  ] as const)("rechaza datos inválidos de %s", (field, input) => {
    try {
      normalizarDatosPaciente(input)
      throw new Error("La validación debía fallar")
    } catch (error) {
      expect(error).toBeInstanceOf(PacienteValidationError)
      expect((error as PacienteValidationError).field).toBe(field)
    }
  })

  it("identifica el campo de errores devueltos por el servidor", () => {
    expect(campoPacienteDesdeMensaje("Ya existe otro paciente con ese DNI.")).toBe("dni")
    expect(campoPacienteDesdeMensaje("Email inválido.")).toBe("email")
    expect(campoPacienteDesdeMensaje("Paciente no encontrado.")).toBeNull()
  })
})
