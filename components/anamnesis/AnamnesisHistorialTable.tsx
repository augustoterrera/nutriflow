"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type AnamnesisRow = {
  id: number
  fecha: string
  tipo_dieta: string
  consumo_verduras: string | null
  consumo_frutas: string | null
  consumo_carnes: string | null
  consumo_agua: string | null
  actividad_fisica: string | null
  consume_suplementos: number
  suplementos_detalle: string | null
  frutas_no_gusta: string | null
  verduras_no_gusta: string | null
  observaciones: string | null
}

/**
 * Tabla del historial de anamnesis. Muestra solo lo principal y permite abrir
 * el detalle con el control accesible de cada fila.
 */
export function AnamnesisHistorialTable({
  registros,
  baseHref,
  safePage,
}: {
  registros: AnamnesisRow[]
  baseHref: string
  safePage: number
}) {
  const [seleccionado, setSeleccionado] = React.useState<AnamnesisRow | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Fecha</TableHead>
            <TableHead>Dieta</TableHead>
            <TableHead>Agua</TableHead>
            <TableHead>Actividad física</TableHead>
            <TableHead>Suplementos</TableHead>
            <TableHead className="pr-4 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro, index) => {
            const fechaLabel = formatFecha(registro.fecha)
            return (
              <TableRow
                key={registro.id}
                className="cursor-pointer"
                onClick={() => setSeleccionado(registro)}
              >
                <TableCell className="px-4">
                  <div className="font-medium">{fechaLabel}</div>
                  {safePage === 1 && index === 0 ? (
                    <div className="text-success mt-0.5 text-xs">más reciente</div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{labelDieta(registro.tipo_dieta)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {registro.consumo_agua || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {registro.actividad_fisica || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {registro.consume_suplementos ? (
                    <Badge variant="outline">Sí</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell
                  className="pr-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ver detalle de la anamnesis del ${fechaLabel}`}
                      title="Ver detalle"
                      onClick={() => setSeleccionado(registro)}
                    >
                      <Eye />
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`${baseHref}/${registro.id}/editar`}
                        aria-label={`Editar anamnesis del ${fechaLabel}`}
                        title="Editar"
                      >
                        <Pencil />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      asChild
                    >
                      <Link
                        href={`${baseHref}/${registro.id}/eliminar`}
                        aria-label={`Eliminar anamnesis del ${fechaLabel}`}
                        title="Eliminar"
                      >
                        <Trash2 />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog
        open={seleccionado !== null}
        onOpenChange={(open) => {
          if (!open) setSeleccionado(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {seleccionado ? (
            <DetalleAnamnesis registro={seleccionado} baseHref={baseHref} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetalleAnamnesis({
  registro,
  baseHref,
}: {
  registro: AnamnesisRow
  baseHref: string
}) {
  const preferencias = [
    registro.frutas_no_gusta ? `Frutas: ${compact(registro.frutas_no_gusta)}` : null,
    registro.verduras_no_gusta
      ? `Verduras: ${compact(registro.verduras_no_gusta)}`
      : null,
  ].filter(Boolean)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Anamnesis · {formatFecha(registro.fecha)}</DialogTitle>
        <DialogDescription>Detalle completo del registro.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 text-sm">
        <Seccion titulo="General">
          <dl className="divide-border divide-y">
            <Campo label="Tipo de dieta">
              <Badge variant="secondary">{labelDieta(registro.tipo_dieta)}</Badge>
            </Campo>
            <Campo label="Actividad física">
              {registro.actividad_fisica || "—"}
            </Campo>
          </dl>
        </Seccion>

        <Seccion titulo="Consumos">
          <dl className="divide-border divide-y">
            <Campo label="Verduras">{registro.consumo_verduras || "—"}</Campo>
            <Campo label="Frutas">{registro.consumo_frutas || "—"}</Campo>
            <Campo label="Carnes">{registro.consumo_carnes || "—"}</Campo>
            <Campo label="Agua">{registro.consumo_agua || "—"}</Campo>
          </dl>
        </Seccion>

        <Seccion titulo="Suplementos">
          <dl className="divide-border divide-y">
            <Campo label="Consume">
              {registro.consume_suplementos ? (
                <Badge variant="outline">Sí</Badge>
              ) : (
                <span className="text-muted-foreground">No</span>
              )}
            </Campo>
            {registro.consume_suplementos ? (
              <Campo label="Detalle">{registro.suplementos_detalle || "—"}</Campo>
            ) : null}
          </dl>
        </Seccion>

        {preferencias.length ? (
          <Seccion titulo="Preferencias">
            <dl className="divide-border divide-y">
              {registro.frutas_no_gusta ? (
                <Campo label="Frutas que no le gustan">
                  {compact(registro.frutas_no_gusta)}
                </Campo>
              ) : null}
              {registro.verduras_no_gusta ? (
                <Campo label="Verduras que no le gustan">
                  {compact(registro.verduras_no_gusta)}
                </Campo>
              ) : null}
            </dl>
          </Seccion>
        ) : null}

        {registro.observaciones ? (
          <Seccion titulo="Observaciones">
            <p className="text-muted-foreground bg-muted/30 rounded-md border p-3 leading-relaxed whitespace-pre-wrap">
              {registro.observaciones}
            </p>
          </Seccion>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          asChild
        >
          <Link href={`${baseHref}/${registro.id}/eliminar`}>Eliminar</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`${baseHref}/${registro.id}/editar`}>Editar</Link>
        </Button>
      </DialogFooter>
    </>
  )
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  )
}

function labelDieta(value: string) {
  if (value === "vegano") return "Vegano"
  if (value === "vegetariano") return "Vegetariano"
  return "Omnívoro"
}

function compact(value: string) {
  const text = value.trim()
  if (!text) return ""
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.join(", ")
    } catch {
      return text
    }
  }
  return text
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10))
  if (!match) return value
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replaceAll(".", "")
}
