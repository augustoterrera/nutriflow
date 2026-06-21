import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Select nativo estilizado con los tokens del sistema (mismo lenguaje visual que
 * Input). Liviano y sin dependencias: ideal para selects simples de opciones fijas.
 */
function SelectNative({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { SelectNative }
