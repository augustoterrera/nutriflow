"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { riesgoCardiometabolico, type NivelRiesgo } from "@/lib/calculos";

// Nivel de riesgo → tokens semánticos (fondo tenue + texto/borde del mismo matiz)
function estiloNivel(nivel: NivelRiesgo) {
  if (nivel === "Bajo")
    return { box: "border-success/20 bg-success/10 text-success", badge: "secondary" as const };
  if (nivel === "Aumentado")
    return { box: "border-warning/20 bg-warning/10 text-warning", badge: "outline" as const };
  // Alto y Muy alto
  return { box: "border-destructive/20 bg-destructive/10 text-destructive", badge: "destructive" as const };
}

export function RiesgoCardiometabolico({
  sexo,
  cinturaCm,
  alturaCm,
  imc,
}: {
  sexo?: string | null;
  cinturaCm?: number | null;
  alturaCm?: number | null;
  imc?: number | null;
}) {
  const { nivel, razones, whtr } = riesgoCardiometabolico({
    sexo,
    cinturaCm,
    alturaCm,
    imc,
  });

  if (!nivel) {
    return (
      <div className="text-sm text-muted-foreground">
        Cargá cintura para estimar riesgo cardiometabólico.
      </div>
    );
  }

  const st = estiloNivel(nivel);

  return (
    <div className={cn("rounded-lg border p-3", st.box)}>
      <div className="flex items-center gap-2">
        <div className="font-bold">Riesgo cardiometabólico</div>
        <Badge variant={st.badge}>{nivel}</Badge>
      </div>

      <div className="mt-1 text-sm opacity-90">
        Cintura: <b>{cinturaCm}</b> cm
        {alturaCm ? (
          <>
            {" "}· Altura: <b>{alturaCm}</b> cm
          </>
        ) : null}
        {whtr !== null ? (
          <>
            {" "}· WHtR: <b>{whtr.toFixed(2)}</b>
          </>
        ) : null}
        {imc !== null && imc !== undefined ? (
          <>
            {" "}· IMC: <b>{imc.toFixed(1)}</b>
          </>
        ) : null}
      </div>

      <div className="mt-1 text-xs opacity-80">
        Señales: {razones.join(" + ")}.
      </div>

      <div className="mt-1 text-xs opacity-70">
        Orientativo (cintura por sexo + WHtR + IMC). No reemplaza evaluación clínica.
      </div>
    </div>
  );
}
