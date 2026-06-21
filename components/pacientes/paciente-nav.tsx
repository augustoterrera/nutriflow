"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const secciones = [
  { label: "Resumen", segment: "" },
  { label: "Ficha", segment: "ficha" },
  { label: "Anamnesis", segment: "anamnesis" },
  { label: "Mediciones", segment: "mediciones" },
  { label: "Planes", segment: "planes" },
] as const

function PacienteNav({
  pacienteId,
  className,
}: {
  pacienteId: number
  className?: string
}) {
  const pathname = usePathname()
  const baseHref = `/dashboard/pacientes/${pacienteId}`

  return (
    <nav
      aria-label="Secciones del paciente"
      className={cn("border-b", className)}
    >
      <div className="overflow-x-auto">
        <ul className="flex min-w-max gap-1" role="list">
          {secciones.map((seccion) => {
            const href = seccion.segment
              ? `${baseHref}/${seccion.segment}`
              : baseHref
            const active = seccion.segment
              ? pathname === href || pathname.startsWith(`${href}/`)
              : pathname === baseHref

            return (
              <li key={seccion.label}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-visible:ring-ring/50 relative -mb-px inline-flex h-11 items-center rounded-t-md border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none",
                    active
                      ? "border-primary bg-muted/40 text-foreground"
                      : "text-muted-foreground hover:bg-muted/20 hover:text-foreground border-transparent"
                  )}
                >
                  {seccion.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export { PacienteNav }
