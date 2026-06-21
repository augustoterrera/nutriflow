export const TIPOS_COMIDA = ["desayuno", "almuerzo", "merienda", "cena", "colacion"] as const;
export type TipoComida = (typeof TIPOS_COMIDA)[number];

// Orden de las filas en la grilla del plan (igual que el PDF de referencia).
export const ORDEN_GRILLA: TipoComida[] = [
  "desayuno",
  "colacion",
  "almuerzo",
  "merienda",
  "cena",
];

export const LABEL_COMIDA: Record<TipoComida, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};
