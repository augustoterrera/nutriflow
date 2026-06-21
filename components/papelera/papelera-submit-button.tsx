"use client"

import { useFormStatus } from "react-dom"
import { RotateCcw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

function PapeleraSubmitButton({ action }: { action: "restaurar" | "eliminar" }) {
  const { pending } = useFormStatus()

  if (action === "restaurar") {
    return (
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <RotateCcw />
        {pending ? "Restaurando..." : "Restaurar"}
      </Button>
    )
  }

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      <Trash2 />
      {pending ? "Eliminando..." : "Sí, eliminar definitivamente"}
    </Button>
  )
}

export { PapeleraSubmitButton }
