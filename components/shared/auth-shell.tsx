import * as React from "react"
import { HeartPulse } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

/**
 * Marco visual de las pantallas de acceso (crear PIN / ingresar PIN): centra el
 * contenido en pantalla completa, muestra la marca NutriFlow y envuelve el
 * formulario en una Card. Aporta el landmark <main> de estas rutas.
 */
function AuthShell({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2 font-semibold">
        <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <HeartPulse className="size-5" />
        </div>
        <span className="text-lg tracking-tight">NutriFlow</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}

export { AuthShell }
