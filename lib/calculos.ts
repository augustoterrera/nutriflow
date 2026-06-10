export type Sexo = "M" | "F" | string | null | undefined;

export type PlanItemCalculo = {
  kcal?: number | null;
  prot?: number | null;
  cho?: number | null;
  gras?: number | null;
  fibra?: number | null;
};

type TotalesBase = {
  kcal: number;
  prot: number;
  cho: number;
  gras: number;
  fibra: number;
};

function redondear(value: number, decimales = 1) {
  const factor = 10 ** decimales;
  return Math.round(value * factor) / factor;
}

function normalizarSexo(sexo: Sexo) {
  return String(sexo ?? "").trim().toUpperCase() === "F" ? "F" : "M";
}

export function calcularIMC(pesoKg: number, alturaCm: number) {
  const alturaM = alturaCm / 100;
  if (!pesoKg || !alturaM) return NaN;
  return pesoKg / (alturaM * alturaM);
}

export function clasificarIMC(imc: number) {
  // Cortes OMS usados por el HTML de referencia para mostrar el badge clínico.
  if (!Number.isFinite(imc)) return { categoria: "Sin datos", claseCss: "muted" };
  if (imc < 18.5) return { categoria: "Bajo peso", claseCss: "warning" };
  if (imc < 25) return { categoria: "Normal", claseCss: "ok" };
  if (imc < 30) return { categoria: "Sobrepeso", claseCss: "warning" };
  if (imc < 35) return { categoria: "Obesidad I", claseCss: "danger" };
  return { categoria: "Obesidad II/III", claseCss: "danger" };
}

export function pesoIdealLorentz(sexo: Sexo, tallaCm: number) {
  // Fórmula de Lorentz: varía solo el divisor final según sexo.
  if (!tallaCm) return null;
  const divisor = normalizarSexo(sexo) === "F" ? 2 : 4;
  return redondear(tallaCm - 100 - (tallaCm - 150) / divisor, 1);
}

export function tmbMifflin(sexo: Sexo, edad: number, pesoKg: number, tallaCm: number) {
  // Mifflin-St Jeor: +5 en hombres y -161 en mujeres, igual al HTML de referencia.
  const ajusteSexo = normalizarSexo(sexo) === "F" ? -161 : 5;
  return Math.round(10 * pesoKg + 6.25 * tallaCm - 5 * edad + ajusteSexo);
}

export function tmbHarris(sexo: Sexo, edad: number, pesoKg: number, tallaCm: number) {
  // Harris-Benedict revisada, con los coeficientes del HTML original.
  if (normalizarSexo(sexo) === "F") {
    return Math.round(447.593 + 9.247 * pesoKg + 3.098 * tallaCm - 4.33 * edad);
  }
  return Math.round(88.362 + 13.397 * pesoKg + 4.799 * tallaCm - 5.677 * edad);
}

export function calcularGET(tmb: number, factorActividad: number) {
  return Math.round(tmb * factorActividad);
}

export function kcalObjetivo(get: number, objetivo: "bajar" | "mantener" | "subir" | string) {
  // Ajuste simple del HTML: déficit/superávit moderado de 400 kcal.
  if (objetivo === "bajar") return get - 400;
  if (objetivo === "subir") return get + 400;
  return get;
}

export function calcularICC(cinturaCm: number, caderaCm: number) {
  if (!cinturaCm || !caderaCm) return null;
  return redondear(cinturaCm / caderaCm, 2);
}

export function riesgoICC(icc: number | null, sexo: Sexo) {
  if (icc == null || !Number.isFinite(icc)) return { riesgo: "Sin datos", alto: false };
  const limite = normalizarSexo(sexo) === "F" ? 0.85 : 0.9;
  return icc > limite
    ? { riesgo: "Riesgo alto", alto: true }
    : { riesgo: "Riesgo bajo", alto: false };
}

export function edadDesdeFechaNacimiento(fechaISO: string | null | undefined) {
  if (!fechaISO) return null;
  const fecha = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const cumpleEsteAnio = new Date(hoy.getFullYear(), fecha.getMonth(), fecha.getDate());
  if (hoy < cumpleEsteAnio) edad -= 1;
  return edad >= 0 ? edad : null;
}

export function totalesPlan(items: PlanItemCalculo[]) {
  const total = items.reduce<TotalesBase>(
    (acc, item) => ({
      kcal: acc.kcal + Number(item.kcal ?? 0),
      prot: acc.prot + Number(item.prot ?? 0),
      cho: acc.cho + Number(item.cho ?? 0),
      gras: acc.gras + Number(item.gras ?? 0),
      fibra: acc.fibra + Number(item.fibra ?? 0),
    }),
    { kcal: 0, prot: 0, cho: 0, gras: 0, fibra: 0 }
  );

  // Los porcentajes salen de kcal aportadas por macros, no de kcal total declarada.
  const kcalMacros = total.prot * 4 + total.cho * 4 + total.gras * 9;

  return {
    kcal: redondear(total.kcal, 0),
    prot: redondear(total.prot, 1),
    cho: redondear(total.cho, 1),
    gras: redondear(total.gras, 1),
    fibra: redondear(total.fibra, 1),
    pProt: kcalMacros ? redondear((total.prot * 4 * 100) / kcalMacros, 0) : 0,
    pCho: kcalMacros ? redondear((total.cho * 4 * 100) / kcalMacros, 0) : 0,
    pGras: kcalMacros ? redondear((total.gras * 9 * 100) / kcalMacros, 0) : 0,
  };
}
