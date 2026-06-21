import { describe, expect, it } from "vitest"

import {
  calcularEvaluacionEnergetica,
  edadEnFecha,
} from "./energia"

describe("evaluación energética", () => {
  it("calcula ambas TMB y usa la fórmula seleccionada para GET", () => {
    const resultado = calcularEvaluacionEnergetica({
      sexo: "M",
      edad: 30,
      pesoKg: 70,
      tallaCm: 175,
      actividad: "moderada",
      formula: "harris",
      objetivoTipo: "mantener",
    })

    expect(resultado.tmbSeleccionada).toBe(resultado.harris)
    expect(resultado.get).toBe(Math.round(resultado.harris * 1.55))
    expect(resultado.objetivoKcal).toBe(resultado.get)
  })

  it("respeta el ajuste profesional manual", () => {
    const resultado = calcularEvaluacionEnergetica({
      sexo: "F",
      edad: 42,
      pesoKg: 64,
      tallaCm: 162,
      actividad: "ligera",
      formula: "mifflin",
      objetivoTipo: "bajar",
      ajusteKcal: -275,
    })

    expect(resultado.ajusteKcal).toBe(-275)
    expect(resultado.objetivoKcal).toBe(resultado.get - 275)
  })
})

describe("edad en la fecha de evaluación", () => {
  it("considera si el cumpleaños ya ocurrió", () => {
    expect(edadEnFecha("1990-08-10", "2026-06-21")).toBe(35)
    expect(edadEnFecha("1990-08-10", "2026-08-10")).toBe(36)
  })

  it("rechaza fechas inválidas o anteriores al nacimiento", () => {
    expect(edadEnFecha("1990-02-30", "2026-06-21")).toBeNull()
    expect(edadEnFecha("1990-08-10", "1989-01-01")).toBeNull()
  })
})
