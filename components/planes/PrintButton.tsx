"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  // Documento claro (papel): usamos un botón oscuro neutro para que contraste.
  // Se oculta al imprimir con `print:hidden`.
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="mb-4 bg-neutral-900 text-neutral-50 hover:bg-neutral-800 print:hidden"
    >
      Guardar como PDF
    </Button>
  );
}
