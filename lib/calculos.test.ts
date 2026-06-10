import { describe, expect, it } from "vitest";
import {
  calcularGET,
  calcularICC,
  calcularIMC,
  clasificarIMC,
  kcalObjetivo,
  pesoIdealLorentz,
  riesgoICC,
  tmbHarris,
  tmbMifflin,
  totalesPlan,
} from "./calculos";

describe("calculos nutricionales", () => {
  it("calcula y clasifica IMC en cortes exactos", () => {
    expect(calcularIMC(70, 170)).toBeCloseTo(24.22, 2);
    expect(clasificarIMC(18.49).categoria).toBe("Bajo peso");
    expect(clasificarIMC(18.5).categoria).toBe("Normal");
    expect(clasificarIMC(25).categoria).toBe("Sobrepeso");
    expect(clasificarIMC(30).categoria).toBe("Obesidad I");
    expect(clasificarIMC(35).categoria).toBe("Obesidad II/III");
  });

  it("calcula peso ideal Lorentz", () => {
    expect(pesoIdealLorentz("M", 170)).toBe(65);
    expect(pesoIdealLorentz("F", 170)).toBe(60);
  });

  it("calcula TMB Mifflin y Harris", () => {
    expect(tmbMifflin("M", 30, 70, 165)).toBe(1586);
    expect(tmbHarris("M", 30, 70, 165)).toBe(1648);
  });

  it("calcula GET y objetivo calorico", () => {
    expect(calcularGET(1586, 1.55)).toBe(2458);
    expect(kcalObjetivo(2458, "bajar")).toBe(2058);
    expect(kcalObjetivo(2458, "mantener")).toBe(2458);
    expect(kcalObjetivo(2458, "subir")).toBe(2858);
  });

  it("calcula ICC y riesgo por sexo", () => {
    expect(calcularICC(95, 100)).toBe(0.95);
    expect(riesgoICC(0.91, "M").alto).toBe(true);
    expect(riesgoICC(0.86, "F").alto).toBe(true);
    expect(riesgoICC(0.84, "F").alto).toBe(false);
  });

  it("calcula totales de plan", () => {
    expect(totalesPlan([])).toEqual({
      kcal: 0,
      prot: 0,
      cho: 0,
      gras: 0,
      fibra: 0,
      pProt: 0,
      pCho: 0,
      pGras: 0,
    });

    const total = totalesPlan([
      { kcal: 200, prot: 10, cho: 30, gras: 4, fibra: 3 },
      { kcal: 100, prot: 5, cho: 10, gras: 4, fibra: 2 },
    ]);
    expect(total.kcal).toBe(300);
    expect(total.prot).toBe(15);
    expect(total.cho).toBe(40);
    expect(total.gras).toBe(8);
    expect(total.fibra).toBe(5);
    expect(total.pProt).toBe(21);
    expect(total.pCho).toBe(55);
    expect(total.pGras).toBe(25);
  });
});
