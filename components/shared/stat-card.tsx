import * as React from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Tarjeta de métrica reutilizable para el dashboard: etiqueta, valor grande y
 * una ayuda opcional debajo.
 */
function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-sm">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { StatCard }
