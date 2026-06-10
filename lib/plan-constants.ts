export const TIPOS_COMIDA = ["desayuno", "almuerzo", "merienda", "cena", "colacion"] as const;
export type TipoComida = (typeof TIPOS_COMIDA)[number];
