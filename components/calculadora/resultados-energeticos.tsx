import { Activity, Flame, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FORMULA_ENERGETICA_LABELS,
  type ResultadoEnergetico,
} from "@/lib/energia"

function ResultadosEnergeticos({ resultado }: { resultado: ResultadoEnergetico }) {
  const formulaActiva = FORMULA_ENERGETICA_LABELS[resultado.formula]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard
          label="Mifflin-St Jeor"
          description="Metabolismo basal"
          value={resultado.mifflin}
          selected={resultado.formula === "mifflin"}
          icon={<Flame className="size-4" aria-hidden="true" />}
        />
        <ResultCard
          label="Harris-Benedict"
          description="Metabolismo basal"
          value={resultado.harris}
          selected={resultado.formula === "harris"}
          icon={<Flame className="size-4" aria-hidden="true" />}
        />
        <ResultCard
          label="GET"
          description={`Factor de actividad ${resultado.factorActividad}`}
          value={resultado.get}
          icon={<Activity className="size-4" aria-hidden="true" />}
        />
        <ResultCard
          label="Objetivo diario"
          description={objetivoDescription(resultado.objetivoTipo)}
          value={resultado.objetivoKcal}
          emphasized
          icon={<Target className="size-4" aria-hidden="true" />}
        />
      </div>

      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base">Cómo se obtuvo</CardTitle>
          <CardDescription>
            El GET usa {formulaActiva} y un factor de actividad de {resultado.factorActividad}.{" "}
            {resultado.ajusteKcal === 0
              ? "El objetivo mantiene ese valor sin ajustes."
              : `El objetivo aplica un ajuste de ${resultado.ajusteKcal > 0 ? "+" : ""}${resultado.ajusteKcal} kcal/día sobre el GET.`}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function ResultCard({
  label,
  description,
  value,
  icon,
  selected = false,
  emphasized = false,
}: {
  label: string
  description: string
  value: number
  icon: React.ReactNode
  selected?: boolean
  emphasized?: boolean
}) {
  return (
    <Card className={emphasized ? "border-primary/40 bg-primary/5" : undefined}>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm">{label}</CardTitle>
          </div>
          {selected ? <Badge variant="secondary">Usada</Badge> : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-semibold tracking-tight">
            {value.toLocaleString("es-AR")}
          </span>
          <span className="text-muted-foreground text-sm">kcal/día</span>
        </p>
      </CardContent>
    </Card>
  )
}

function objetivoDescription(objetivo: ResultadoEnergetico["objetivoTipo"]) {
  if (objetivo === "bajar") return "Déficit definido"
  if (objetivo === "subir") return "Superávit definido"
  return "Mantenimiento"
}

export { ResultadosEnergeticos }
