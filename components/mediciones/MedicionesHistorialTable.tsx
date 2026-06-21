"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"

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
import { calcularIMC } from "@/lib/calculos"
import { cn } from "@/lib/utils"

export type MedicionRow = {
  id: number
  fecha: string
  peso_kg: number | null
  altura_cm: number | null
  cintura_cm: number | null
  cadera_cm: number | null
  cuello_cm: number | null
  grasa_pct: number | null
  musculo_pct: number | null
  brazo_cm: number | null
  muneca_cm: number | null
  observaciones: string | null
}

// Fila con todos los valores derivados ya calculados (IMC, WHtR y los anteriores
// para los deltas). Se calcula una vez en el cliente para alimentar tabla + modal.
type Fila = {
  registro: MedicionRow
  anterior: MedicionRow | null
  altura: number | null
  imc: number | null
  imcAnterior: number | null
  whtr: number | null
}

/**
 * Tabla del historial de mediciones. Muestra solo lo principal y, al hacer clic
 * en una fila (o en el icono de ver), abre un modal con el detalle completo.
 */
export function MedicionesHistorialTable({
  registros,
  alturaRef,
  baseHref,
  safePage,
}: {
  registros: MedicionRow[]
  alturaRef: number | null
  baseHref: string
  safePage: number
}) {
  const filas = React.useMemo<Fila[]>(() => {
    return registros.map((registro, index) => {
      const anterior = registros[index + 1] ?? null
      const altura = registro.altura_cm || alturaRef
      const alturaAnterior = anterior?.altura_cm || alturaRef
      const imc =
        registro.peso_kg && altura
          ? calcularIMC(Number(registro.peso_kg), Number(altura))
          : null
      const imcAnterior =
        anterior?.peso_kg && alturaAnterior
          ? calcularIMC(Number(anterior.peso_kg), Number(alturaAnterior))
          : null
      const whtr =
        registro.cintura_cm && altura
          ? Number(registro.cintura_cm) / Number(altura)
          : null
      return { registro, anterior, altura, imc, imcAnterior, whtr }
    })
  }, [registros, alturaRef])

  const [seleccionada, setSeleccionada] = React.useState<Fila | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Fecha</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Cintura</TableHead>
            <TableHead>IMC</TableHead>
            <TableHead>WHtR</TableHead>
            <TableHead className="pr-4 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila, index) => {
            const { registro, anterior } = fila
            const fechaLabel = formatFecha(registro.fecha)
            return (
              <TableRow
                key={registro.id}
                role="button"
                tabIndex={0}
                aria-label={`Ver detalle de la medición del ${fechaLabel}`}
                className="cursor-pointer"
                onClick={() => setSeleccionada(fila)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSeleccionada(fila)
                  }
                }}
              >
                <TableCell className="px-4">
                  <div className="font-medium">{fechaLabel}</div>
                  {safePage === 1 && index === 0 ? (
                    <div className="text-success mt-0.5 text-xs">más reciente</div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <MetricCell
                    value={registro.peso_kg}
                    previous={anterior?.peso_kg}
                    unit="kg"
                  />
                </TableCell>
                <TableCell>
                  <MetricCell
                    value={registro.cintura_cm}
                    previous={anterior?.cintura_cm}
                    unit="cm"
                  />
                </TableCell>
                <TableCell>
                  <MetricCell value={fila.imc} previous={fila.imcAnterior} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {fila.whtr !== null ? fila.whtr.toFixed(2) : "—"}
                </TableCell>
                <TableCell
                  className="pr-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ver detalle de la medición del ${fechaLabel}`}
                      title="Ver detalle"
                      onClick={() => setSeleccionada(fila)}
                    >
                      <Eye />
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`${baseHref}/${registro.id}/editar`}
                        aria-label={`Editar medición del ${fechaLabel}`}
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
                        aria-label={`Eliminar medición del ${fechaLabel}`}
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
        open={seleccionada !== null}
        onOpenChange={(open) => {
          if (!open) setSeleccionada(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {seleccionada ? (
            <DetalleMedicion fila={seleccionada} baseHref={baseHref} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetalleMedicion({ fila, baseHref }: { fila: Fila; baseHref: string }) {
  const { registro, anterior, altura, imc, imcAnterior, whtr } = fila

  return (
    <>
      <DialogHeader>
        <DialogTitle>Medición · {formatFecha(registro.fecha)}</DialogTitle>
        <DialogDescription>Detalle completo de la medición.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 text-sm">
        <Seccion titulo="Antropometría">
          <dl className="divide-border divide-y">
            <Medida
              label="Peso"
              value={registro.peso_kg}
              previous={anterior?.peso_kg}
              unit="kg"
            />
            <Medida label="Altura" value={altura} unit="cm" decimals={0} />
            <Medida
              label="Cintura"
              value={registro.cintura_cm}
              previous={anterior?.cintura_cm}
              unit="cm"
            />
            <Medida label="IMC" value={imc} previous={imcAnterior} decimals={2} />
            <Medida label="WHtR" value={whtr} decimals={2} />
          </dl>
        </Seccion>

        {registro.grasa_pct != null || registro.musculo_pct != null ? (
          <Seccion titulo="Composición corporal">
            <dl className="divide-border divide-y">
              <Medida label="Grasa" value={registro.grasa_pct} unit="%" />
              <Medida label="Músculo" value={registro.musculo_pct} unit="%" />
            </dl>
          </Seccion>
        ) : null}

        {registro.cadera_cm != null ||
        registro.cuello_cm != null ||
        registro.brazo_cm != null ||
        registro.muneca_cm != null ? (
          <Seccion titulo="Perímetros">
            <dl className="divide-border divide-y">
              <Medida label="Cadera" value={registro.cadera_cm} unit="cm" />
              <Medida label="Cuello" value={registro.cuello_cm} unit="cm" />
              <Medida label="Brazo" value={registro.brazo_cm} unit="cm" />
              <Medida label="Muñeca" value={registro.muneca_cm} unit="cm" />
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

function Medida({
  label,
  value,
  previous,
  unit,
  decimals = 1,
}: {
  label: string
  value: number | null | undefined
  previous?: number | null
  unit?: string
  decimals?: number
}) {
  const hasValue = value !== null && value !== undefined
  const current = hasValue ? Number(value) : null
  const previousNumber =
    previous === null || previous === undefined ? null : Number(previous)
  const delta =
    current !== null && previousNumber !== null ? current - previousNumber : null

  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">
        {current !== null ? (
          <span className="inline-flex items-baseline gap-2">
            <span>
              {current.toFixed(decimals)}
              {unit ? ` ${unit}` : ""}
            </span>
            {delta !== null ? <DeltaBadge delta={delta} decimals={decimals} /> : null}
          </span>
        ) : (
          "—"
        )}
      </dd>
    </div>
  )
}

function MetricCell({
  value,
  previous,
  unit,
}: {
  value: number | null
  previous?: number | null
  unit?: string
}) {
  if (value === null || value === undefined) return <>—</>
  const current = Number(value)
  const previousNumber =
    previous === null || previous === undefined ? null : Number(previous)
  const delta = previousNumber !== null ? current - previousNumber : null

  return (
    <div className="flex items-baseline gap-1.5">
      <span>
        {current.toFixed(1)}
        {unit ? ` ${unit}` : ""}
      </span>
      {delta !== null ? <DeltaBadge delta={delta} decimals={1} /> : null}
    </div>
  )
}

function DeltaBadge({ delta, decimals }: { delta: number; decimals: number }) {
  return (
    <span
      className={cn(
        "text-xs font-medium",
        delta < 0 && "text-success",
        delta > 0 && "text-destructive",
        delta === 0 && "text-muted-foreground"
      )}
    >
      {delta < 0 ? "↓" : delta > 0 ? "↑" : "→"}
      {Math.abs(delta).toFixed(decimals)}
    </span>
  )
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
