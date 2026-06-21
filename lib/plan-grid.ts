// Tipos y helpers puros de la grilla del plan. Sin acceso a la DB, para poder
// importarse tanto desde el editor (cliente) como desde el servidor.

export type PlanSemana = {
  titulo: string;
  dias: number;
  // Clave `${tipo}:${indiceDia}` → texto de la celda. Ej: "almuerzo:0".
  celdas: Record<string, string>;
};

export type PlanGrid = {
  objetivo: string;
  kcalObjetivo: string;
  peso: string;
  talla: string;
  imc: string;
  semanas: PlanSemana[];
};

export type PlanGridCompleto = PlanGrid & {
  id: number;
  nombre: string;
  fecha: string | null;
};

export function semanaVacia(titulo = "Semana 1", dias = 5): PlanSemana {
  return { titulo, dias, celdas: {} };
}

export function gridVacio(): PlanGrid {
  return {
    objetivo: "",
    kcalObjetivo: "",
    peso: "",
    talla: "",
    imc: "",
    semanas: [semanaVacia()],
  };
}

// Normaliza un valor crudo (string JSON o desconocido) a un PlanGrid válido.
export function parseGrid(raw: unknown): PlanGrid {
  if (typeof raw !== "string" || !raw.trim()) return gridVacio();
  try {
    const data = JSON.parse(raw) as Partial<PlanGrid>;
    const semanas =
      Array.isArray(data.semanas) && data.semanas.length
        ? data.semanas.map((s, i) => ({
            titulo: String(s?.titulo ?? `Semana ${i + 1}`),
            dias: Math.max(1, Number(s?.dias) || 5),
            celdas: (s?.celdas && typeof s.celdas === "object" ? s.celdas : {}) as Record<string, string>,
          }))
        : [semanaVacia()];
    return {
      objetivo: String(data.objetivo ?? ""),
      kcalObjetivo: String(data.kcalObjetivo ?? ""),
      peso: String(data.peso ?? ""),
      talla: String(data.talla ?? ""),
      imc: String(data.imc ?? ""),
      semanas,
    };
  } catch {
    return gridVacio();
  }
}
