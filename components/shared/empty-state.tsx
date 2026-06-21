import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Estado vacío estándar para listas/tablas/datos sin contenido. Centraliza el
 * mensaje "todavía no hay…" con un ícono opcional y una acción de llamado.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon ? (
        <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
