"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"

function toISODate(d: Date) {
  // YYYY-MM-DD en hora local (evita problemas de timezone)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function DatePickerSimple({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: string // "YYYY-MM-DD"
}) {
  const [open, setOpen] = React.useState(false)

  // Calculamos años coherentes
  const añoActual = new Date().getFullYear()
  const añoMinimo = añoActual - 110 // Personas de hasta 110 años

  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!defaultValue) return undefined
    const [y, m, d] = defaultValue.split("-").map(Number)
    if (!y || !m || !d) return undefined
    return new Date(y, m - 1, d)
  })

  const value = date ? toISODate(date) : ""

  return (
    <Field className="w-44 border border-white rounded-md">
      <input type="hidden" name={name} value={value} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={name}
            className="w-full justify-start font-normal hover:bg-slate-800"
            type="button"
          >
            {date ? date.toLocaleDateString("es-ES") : "Seleccionar fecha"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 bg-black border-slate-800" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            locale={es}
            captionLayout="dropdown"
            // También configuramos meses para asegurar el rango completo
            startMonth={new Date(añoMinimo, 0)}
            endMonth={new Date(añoActual, 11)}
            classNames={{
              dropdown:
                " bg-black text-white border border-slate-700 rounded-md p-0.5 text-xs focus:ring-0 outline-none cursor-pointer max-w-[80px]",
              caption_label: "hidden h-20",
              dropdown_year: "ml-2", // Un pequeño margen para separar mes de año
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}