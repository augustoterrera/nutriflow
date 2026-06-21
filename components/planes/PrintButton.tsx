"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="mb-4 print:hidden"
    >
      <Printer />
      Guardar como PDF
    </Button>
  );
}
