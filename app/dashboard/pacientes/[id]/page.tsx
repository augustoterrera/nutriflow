import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import {
  calcularICC,
  calcularIMC,
  clasificarIMC,
  edadDesdeFechaNacimiento,
  pesoIdealLorentz,
  riesgoCardiometabolico,
  riesgoICC,
  tmbMifflin,
  type NivelRiesgo,
} from "@/lib/calculos";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { ImcCard } from "@/components/pacientes/ImcCard";
import { EvolucionDialogLazy } from "@/components/pacientes/EvolucionDialogLazy";

import { cn } from "@/lib/utils";
import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PacientePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const db = await getDB();

  const [paciente, ultimaAnamnesis, rowCountAnam, rowCountPlanes, mediciones] =
    await Promise.all([
      db.get(`select * from pacientes where id = ? and activo = 1`, [id]),
      db.get(
        `select * from anamnesis where paciente_id = ? order by date(fecha) desc, id desc limit 1`,
        [id]
      ),
      db.get(`select count(*) as total from anamnesis where paciente_id = ?`, [id]),
      db.get(`select count(*) as total from planes where paciente_id = ?`, [id]),
      db.all(
        `select * from mediciones where paciente_id = ? order by date(fecha) desc, id desc`,
        [id]
      ),
    ]);

  if (!paciente) notFound();

  const totalAnamnesis = Number(rowCountAnam?.total ?? 0);
  const totalPlanes = Number(rowCountPlanes?.total ?? 0);
  const ultimaMedicion = mediciones[0] ?? null;
  const anteriorMedicion = mediciones[1] ?? null;
  const primeraMedicion = mediciones[mediciones.length - 1] ?? null;

  const alturaRef =
    ultimaMedicion?.altura_cm || mediciones.find((m) => m.altura_cm)?.altura_cm || null;

  const imc =
    ultimaMedicion?.peso_kg && alturaRef
      ? calcularIMC(ultimaMedicion.peso_kg, alturaRef)
      : null;
  const imcAnteriorRaw =
    anteriorMedicion?.peso_kg && (anteriorMedicion?.altura_cm || alturaRef)
      ? calcularIMC(anteriorMedicion.peso_kg, anteriorMedicion.altura_cm || alturaRef)
      : null;
  const imcAnterior =
    imcAnteriorRaw !== null && Number.isFinite(imcAnteriorRaw) ? imcAnteriorRaw : null;

  const edad = edadDesdeFechaNacimiento(paciente.fecha_nacimiento);
  // Lorentz, TMB y riesgo ICC dependen del sexo: sin sexo cargado no se estiman
  const sexoNorm = String(paciente.sexo ?? "").trim().toUpperCase();
  const tieneSexo = sexoNorm === "M" || sexoNorm === "F";
  const lorentz = tieneSexo && alturaRef ? pesoIdealLorentz(paciente.sexo, Number(alturaRef)) : null;
  const tmb =
    tieneSexo && edad && ultimaMedicion?.peso_kg && alturaRef
      ? tmbMifflin(paciente.sexo, edad, Number(ultimaMedicion.peso_kg), Number(alturaRef))
      : null;
  const icc =
    ultimaMedicion?.cintura_cm && ultimaMedicion?.cadera_cm
      ? calcularICC(Number(ultimaMedicion.cintura_cm), Number(ultimaMedicion.cadera_cm))
      : null;
  const iccRiesgo = tieneSexo
    ? riesgoICC(icc, paciente.sexo)
    : { riesgo: "Cargá sexo para estimar riesgo", alto: false };

  // Riesgo cardiometabólico (cintura + WHtR + IMC) para el badge del header y la señal
  const riesgo = riesgoCardiometabolico({
    sexo: paciente.sexo,
    cinturaCm: ultimaMedicion?.cintura_cm ?? null,
    alturaCm: alturaRef,
    imc,
  });
  const whtr = riesgo.whtr;

  const calcParams = new URLSearchParams();
  if (edad) calcParams.set("edad", String(edad));
  if (ultimaMedicion?.peso_kg) calcParams.set("peso", String(ultimaMedicion.peso_kg));
  if (alturaRef) calcParams.set("talla", String(alturaRef));
  if (paciente.sexo) calcParams.set("sexo", String(paciente.sexo));
  const calcHref = `/dashboard/calculadora?${calcParams.toString()}`;
  const puedeCalcular = Boolean(edad && ultimaMedicion?.peso_kg && alturaRef);

  const resumen =
    ultimaMedicion && anteriorMedicion
      ? resumenTendencia(ultimaMedicion, anteriorMedicion)
      : null;

  const imcClase = imc !== null ? clasificarIMC(imc) : null;

  const base = `/dashboard/pacientes/${id}`;

  return (
    <PageShell>
      <PacienteWorkspaceHeader
        paciente={paciente}
        badge={riesgo.nivel ? <RiskBadge nivel={riesgo.nivel} /> : null}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`${base}/anamnesis/nueva`}>Nueva anamnesis</Link>
            </Button>
            <Button asChild>
              <Link href={`${base}/mediciones/nueva`}>Nueva medición</Link>
            </Button>
          </>
        }
      />

      {ultimaMedicion ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <VitalCard
            label="Peso"
            value={ultimaMedicion.peso_kg ?? null}
            unit="kg"
            delta={formatDelta(ultimaMedicion.peso_kg, anteriorMedicion?.peso_kg)}
          />
          <VitalCard
            label="Cintura"
            value={ultimaMedicion.cintura_cm ?? null}
            unit="cm"
            delta={formatDelta(ultimaMedicion.cintura_cm, anteriorMedicion?.cintura_cm)}
          />
          <VitalCard
            label="IMC"
            value={imc !== null ? Number(imc.toFixed(1)) : null}
            sub={imcClase?.categoria}
            tone={imcClase?.claseCss}
            delta={formatDelta(imc, imcAnterior)}
          />
          <VitalCard
            label="WHtR"
            value={whtr !== null ? Number(whtr.toFixed(2)) : null}
            unit="ratio"
          />
          <VitalCard label="Altura" value={alturaRef} unit="cm" />
        </div>
      ) : null}

      {/* ===== Resumen ===== */}
      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-4">
          {/* Señal de riesgo */}
          {ultimaMedicion?.cintura_cm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  Riesgo cardiometabólico
                  {riesgo.nivel ? <RiskBadge nivel={riesgo.nivel} /> : null}
                </CardTitle>
                <CardDescription>
                  Cintura <b className="text-foreground">{ultimaMedicion.cintura_cm}</b> cm
                  {alturaRef ? <> · Altura <b className="text-foreground">{alturaRef}</b> cm</> : null}
                  {whtr !== null ? <> · WHtR <b className="text-foreground">{whtr.toFixed(2)}</b></> : null}
                  {imc !== null ? <> · IMC <b className="text-foreground">{imc.toFixed(1)}</b></> : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Señales: {riesgo.razones.join(" + ")}.
                </p>
                <p className="text-muted-foreground text-xs">
                  Orientativo (cintura por sexo + WHtR + IMC). No reemplaza evaluación
                  clínica.
                </p>
                {imc !== null ? <ImcCard imc={imc} fecha={ultimaMedicion.fecha} /> : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Evolución */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución</CardTitle>
              <CardDescription>
                {primeraMedicion?.fecha
                  ? `Cambio desde ${primeraMedicion.fecha}`
                  : "Comparaciones automáticas según mediciones cargadas."}
              </CardDescription>
              {mediciones.length > 0 ? (
                <CardAction>
                  <EvolucionDialogLazy mediciones={mediciones} />
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {!ultimaMedicion ? (
                <p className="text-muted-foreground text-sm">
                  Todavía no hay mediciones para calcular evolución.
                </p>
              ) : !anteriorMedicion ? (
                <p className="text-muted-foreground text-sm">
                  Cargá una segunda medición para ver la evolución.
                </p>
              ) : (
                <>
                  {resumen ? (
                    <div className="bg-success/10 border-success/20 flex flex-wrap items-center gap-3 rounded-lg border p-3 data-[alerta=true]:bg-destructive/10 data-[alerta=true]:border-destructive/20"
                      data-alerta={resumen.alerta}
                    >
                      {resumen.icon}
                      <span className="font-bold">{resumen.titulo}</span>
                      <span className="text-muted-foreground ml-auto text-sm">
                        {resumen.detalle}
                      </span>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <DeltaCard
                      label="Peso"
                      unidad="kg"
                      actual={ultimaMedicion.peso_kg}
                      previo={anteriorMedicion.peso_kg}
                    />
                    <DeltaCard
                      label="Cintura"
                      unidad="cm"
                      actual={ultimaMedicion.cintura_cm}
                      previo={anteriorMedicion.cintura_cm}
                    />
                    <DeltaCard label="IMC" actual={imc} previo={imcAnterior} />
                  </div>

                  <p className="text-muted-foreground text-xs">
                    {renderRitmo(ultimaMedicion, primeraMedicion)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">
          {/* Cálculos clínicos */}
          <Card>
            <CardHeader>
              <CardTitle>Cálculos clínicos</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <CalcRow
                  label="Peso ideal"
                  sub="Lorentz"
                  value={lorentz !== null ? `${lorentz} kg` : "—"}
                />
                <CalcRow
                  label="TMB"
                  sub="Mifflin-St Jeor"
                  value={tmb !== null ? `${tmb} kcal` : "—"}
                />
                {icc !== null ? (
                  <CalcRow label="ICC" sub={iccRiesgo.riesgo} value={icc.toFixed(2)} danger={iccRiesgo.alto} />
                ) : null}
              </dl>
              {puedeCalcular ? (
                <Button asChild className="mt-4 w-full">
                  <Link href={calcHref}>Calcular kcal objetivo</Link>
                </Button>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">
                  Cargá edad, peso y altura para estimar las kcal objetivo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Última anamnesis */}
          <Card>
            <CardHeader>
              <CardTitle>Última anamnesis</CardTitle>
              <CardDescription>
                {totalAnamnesis} {totalAnamnesis === 1 ? "registro" : "registros"}
              </CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${base}/anamnesis`}>Ver</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {!ultimaAnamnesis ? (
                <p className="text-muted-foreground text-sm">
                  Todavía no hay anamnesis cargadas.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{ultimaAnamnesis.fecha}</span>
                    <Badge variant="secondary">{labelDieta(ultimaAnamnesis.tipo_dieta)}</Badge>
                  </div>
                  {ultimaAnamnesis.observaciones ? (
                    <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
                      {ultimaAnamnesis.observaciones}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin observaciones.</p>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${base}/anamnesis/nueva`}>Nueva anamnesis</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan alimentario */}
          <Card>
            <CardHeader>
              <CardTitle>Plan alimentario</CardTitle>
              <CardDescription>
                {totalPlanes} {totalPlanes === 1 ? "plan" : "planes"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalPlanes === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Este paciente todavía no tiene un plan asignado.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {totalPlanes === 0 ? (
                  <Button asChild>
                    <Link href={`${base}/planes/nuevo`}>Crear primer plan</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link href={`${base}/planes`}>Ver planes</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`${base}/planes/nuevo`}>Nuevo plan</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// --- COMPONENTES DE APOYO ---

function RiskBadge({ nivel }: { nivel: NivelRiesgo }) {
  if (nivel === "Alto" || nivel === "Muy alto") {
    return <Badge variant="destructive">Riesgo {nivel.toLowerCase()}</Badge>;
  }
  if (nivel === "Aumentado") {
    return (
      <Badge variant="outline" className="border-warning/40 text-warning">
        Riesgo aumentado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-success/40 text-success">
      Riesgo bajo
    </Badge>
  );
}

function VitalCard({
  label,
  value,
  unit,
  sub,
  tone = "muted",
  delta,
}: {
  label: string;
  value: number | null;
  unit?: string;
  sub?: string;
  tone?: string;
  delta?: { text: string; dir: "up" | "down" | "flat" } | null;
}) {
  // El IMC se resalta con el color de su clasificación clínica.
  const danger = tone === "danger";
  const warning = tone === "warning";
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        danger && "border-destructive/20 bg-destructive/10",
        warning && "border-warning/20 bg-warning/10",
        !danger && !warning && "bg-card"
      )}
    >
      <div className={cn("text-xs", danger ? "text-destructive" : "text-muted-foreground")}>
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={cn("text-xl font-bold", danger && "text-destructive", warning && "text-warning")}
        >
          {value ?? "—"}
        </span>
        {unit ? <span className="text-muted-foreground text-xs">{unit}</span> : null}
        {sub ? <span className="text-muted-foreground text-xs">{sub}</span> : null}
        {delta ? (
          <span
            className={cn(
              "ml-auto text-xs font-semibold",
              delta.dir === "down" && "text-success",
              delta.dir === "up" && "text-destructive",
              delta.dir === "flat" && "text-muted-foreground"
            )}
          >
            {delta.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DeltaCard({
  label,
  unidad,
  actual,
  previo,
}: {
  label: string;
  unidad?: string;
  actual: number | null;
  previo: number | null;
}) {
  if (actual === null || actual === undefined || previo === null || previo === undefined) {
    return (
      <div className="bg-muted/30 rounded-lg border p-3">
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className="text-muted-foreground mt-1 text-xl font-bold">—</div>
      </div>
    );
  }
  const a = Number(actual);
  const p = Number(previo);
  const delta = a - p;
  // Verde = baja (mejora), rojo = sube, neutro = sin cambio
  const color = delta < 0 ? "text-success" : delta > 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="bg-muted/30 rounded-lg border p-3">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className={cn("mt-1 text-xl font-bold", color)}>
        {delta > 0 ? "+" : ""}
        {delta.toFixed(1)}
        {unidad ? ` ${unidad}` : ""}
      </div>
      <div className="text-muted-foreground mt-1 text-xs">
        {a.toFixed(1)} hoy · antes {p.toFixed(1)}
      </div>
    </div>
  );
}

function CalcRow({
  label,
  sub,
  value,
  danger = false,
}: {
  label: string;
  sub?: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-sm">
        <span className="text-muted-foreground">{label}</span>
        {sub ? (
          <span className={cn("ml-1.5 text-xs", danger ? "text-destructive" : "text-muted-foreground/70")}>
            · {sub}
          </span>
        ) : null}
      </dt>
      <dd className="text-sm font-bold">{value}</dd>
    </div>
  );
}

function formatDelta(
  actual: any,
  previo: any,
  dec = 1
): { text: string; dir: "up" | "down" | "flat" } | null {
  if (actual === null || actual === undefined || previo === null || previo === undefined) {
    return null;
  }
  const a = Number(actual);
  const p = Number(previo);
  if (!Number.isFinite(a) || !Number.isFinite(p)) return null;
  const d = a - p;
  const dir = d < 0 ? "down" : d > 0 ? "up" : "flat";
  const arrow = d < 0 ? "↓" : d > 0 ? "↑" : "→";
  return { text: `${arrow}${Math.abs(d).toFixed(dec)}`, dir };
}

function labelDieta(v: any) {
  if (v === "vegano") return "Vegano";
  if (v === "vegetariano") return "Vegetariano";
  return "Omnívoro";
}

function renderRitmo(ultima: any, base: any) {
  const d = diasEntre(ultima?.fecha, base?.fecha);
  if (!d || d < 4) return "Ritmo: datos insuficientes";

  const semanas = d / 7;
  const dp = Number(ultima?.peso_kg) - Number(base?.peso_kg);
  const dc = Number(ultima?.cintura_cm) - Number(base?.cintura_cm);

  const parts: string[] = [];
  if (Number.isFinite(dp)) parts.push(`${(dp / semanas).toFixed(2)} kg/sem`);
  if (Number.isFinite(dc)) parts.push(`${(dc / semanas).toFixed(2)} cm/sem`);

  return parts.length ? `Ritmo: ${parts.join(" · ")}` : "Ritmo: sin datos";
}

function resumenTendencia(ultima: any, anterior: any) {
  const dp = Number(ultima?.peso_kg) - Number(anterior?.peso_kg);
  const dc = Number(ultima?.cintura_cm) - Number(anterior?.cintura_cm);

  const pesoOk = Number.isFinite(dp);
  const cinturaOk = Number.isFinite(dc);

  if (!pesoOk && !cinturaOk) {
    return { titulo: "Sin datos", detalle: "Cargá mediciones.", alerta: false, icon: <Minus className="size-4.5 text-muted-foreground" /> };
  }

  // Si falta una de las dos métricas, evaluamos solo con la disponible
  if (!pesoOk || !cinturaOk) {
    const d = pesoOk ? dp : dc;
    const nombre = pesoOk ? "Peso" : "Cintura";
    if (d < 0) {
      return { titulo: "Tendencia: Mejorando", detalle: `${nombre} en descenso.`, alerta: false, icon: <TrendingDown className="size-4.5 text-success" /> };
    }
    if (d > 0) {
      return { titulo: "Tendencia: Alerta", detalle: `${nombre} en aumento.`, alerta: true, icon: <TrendingUp className="size-4.5 text-destructive" /> };
    }
    return { titulo: "Tendencia: Estable", detalle: `${nombre} sin cambios.`, alerta: false, icon: <Minus className="size-4.5 text-muted-foreground" /> };
  }

  if (dc <= -1 && dp >= -0.3 && dp <= 0.5) {
    return {
      titulo: "Recomposición corporal",
      detalle: "Cintura bajó manteniendo peso.",
      alerta: false,
      icon: <Activity className="size-4.5 text-info" />,
    };
  }

  if (dp <= 0 && dc <= 0) {
    return { titulo: "Tendencia: Mejorando", detalle: "Peso y cintura en descenso.", alerta: false, icon: <TrendingDown className="size-4.5 text-success" /> };
  }

  if (dp > 0 && dc > 0) {
    return { titulo: "Tendencia: Alerta", detalle: "Aumento de peso y medidas.", alerta: true, icon: <TrendingUp className="size-4.5 text-destructive" /> };
  }

  return { titulo: "Tendencia: Mixta", detalle: "Valores con cambios irregulares.", alerta: false, icon: <Minus className="size-4.5 text-muted-foreground" /> };
}

function diasEntre(a: any, b: any) {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.abs(da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24);
}
