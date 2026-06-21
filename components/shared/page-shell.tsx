import * as React from "react"

import { cn } from "@/lib/utils"

const widthMap = {
  full: "max-w-none",
  prose: "max-w-2xl",
  form: "max-w-3xl",
  default: "max-w-6xl",
} as const

/**
 * Contenedor estándar de página: centra el contenido, aplica padding y ancho
 * máximo consistente. Reemplaza los paddings inline sueltos.
 */
function PageShell({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & {
  width?: keyof typeof widthMap
}) {
  return (
    <div
      data-slot="page-shell"
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8",
        widthMap[width],
        className
      )}
      {...props}
    />
  )
}

export { PageShell }
