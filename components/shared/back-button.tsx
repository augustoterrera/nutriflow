"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const mainDashboardRoutes = new Set([
  "/dashboard",
  "/dashboard/pacientes",
  "/dashboard/calculadora",
  "/dashboard/alimentos",
  "/dashboard/papelera",
])

/**
 * Navegación atrás para subrutas del dashboard. En accesos directos sin
 * historial, vuelve al inicio para que la acción siempre tenga un destino seguro.
 */
function BackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const initialHistoryLength = React.useRef<number | null>(null)

  React.useEffect(() => {
    initialHistoryLength.current = window.history.length
  }, [])

  function handleBack() {
    const referrer = document.referrer ? new URL(document.referrer) : null
    const referrerIsDashboard =
      referrer?.origin === window.location.origin &&
      referrer.pathname.startsWith("/dashboard")
    const hasNewHistoryEntry =
      initialHistoryLength.current !== null &&
      window.history.length > initialHistoryLength.current

    if (referrerIsDashboard || hasNewHistoryEntry) {
      router.back()
      return
    }

    router.push("/dashboard")
  }

  if (mainDashboardRoutes.has(pathname)) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Volver a la página anterior"
          >
            <ArrowLeft />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">Volver</TooltipContent>
    </Tooltip>
  )
}

export { BackButton }
