import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Paginación previa/siguiente para listados. Cuando un extremo no aplica, se
 * renderiza un botón deshabilitado real (no un <a> inerte).
 */
function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
}) {
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div className="flex items-center justify-between gap-2">
      {prevDisabled ? (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-4" /> Anterior
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page - 1)}>
            <ChevronLeft className="size-4" /> Anterior
          </Link>
        </Button>
      )}

      <span className="text-muted-foreground text-sm">
        Página {page} de {totalPages}
      </span>

      {nextDisabled ? (
        <Button variant="outline" size="sm" disabled>
          Siguiente <ChevronRight className="size-4" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page + 1)}>
            Siguiente <ChevronRight className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

export { Pagination }
