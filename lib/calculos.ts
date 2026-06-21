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

export type NivelRiesgo = "Bajo" | "Aumentado" | "Alto" | "Muy alto";

/**
 * Riesgo cardiometabólico orientativo: combina cintura (por sexo), WHtR (cintura/altura)
 * e IMC como amplificador. Devuelve el nivel y las señales que lo justifican.
 * Función pura para reutilizar entre el badge del header y la tarjeta clínica.
 */
export function riesgoCardiometabolico(opts: {
  sexo?: Sexo;
  cinturaCm?: number | null;
  alturaCm?: number | null;
  imc?: number | null;
}): { nivel: NivelRiesgo | null; razones: string[]; whtr: number | null } {
  const { sexo, cinturaCm, alturaCm, imc } = opts;
  if (!cinturaCm || cinturaCm <= 0) {
    return { nivel: null, razones: [], whtr: null };
  }

  const razones: string[] = [];

  // Cintura por sexo (umbral aumentado / alto). Sexo desconocido usa cortes masculinos.
  const esF = normalizarSexo(sexo) === "F";
  const aumentado = esF ? 80 : 94;
  const alto = esF ? 88 : 102;
  let sCintura = 0;
  if (cinturaCm >= alto) sCintura = 2;
  else if (cinturaCm >= aumentado) sCintura = 1;
  if (sCintura === 2) razones.push("cintura alta");
  else if (sCintura === 1) razones.push("cintura aumentada");
  else razones.push("cintura en rango");

  // WHtR (si hay altura): >=0.5 aumenta riesgo, >=0.6 muy alto.
  let sWhtr = 0;
  let whtr: number | null = null;
  if (alturaCm && alturaCm > 0) {
    whtr = cinturaCm / alturaCm;
    if (whtr >= 0.6) sWhtr = 2;
    else if (whtr >= 0.5) sWhtr = 1;
    if (sWhtr === 2) razones.push("WHtR muy alto (≥0.60)");
    else if (sWhtr === 1) razones.push("WHtR alto (≥0.50)");
  } else {
    razones.push("faltó altura (no WHtR)");
  }

  // IMC como amplificador.
  let amp = 0;
  if (imc !== null && imc !== undefined) {
    if (imc >= 30) {
      amp = 1;
      razones.push("IMC ≥ 30");
    } else if (imc >= 25) {
      razones.push("IMC ≥ 25");
    }
  }

  // Puntaje total → nivel (0-1 bajo, 2 aumentado, 3-4 alto, 5 muy alto).
  const total = sCintura + sWhtr + amp;
  let nivelNum = 0;
  if (total <= 1) nivelNum = 0;
  else if (total === 2) nivelNum = 1;
  else if (total <= 4) nivelNum = 2;
  else nivelNum = 3;

  const nivel = (["Bajo", "Aumentado", "Alto", "Muy alto"] as const)[nivelNum];
  return { nivel, razones, whtr };
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
