"use client";

import { Badge } from "@/components/ui/badge";

type Nivel = "Bajo" | "Aumentado" | "Alto" | "Muy alto";

function clampNivel(n: number) {
  return Math.max(0, Math.min(3, n));
}

function nivelToLabel(n: number): Nivel {
  return (["Bajo", "Aumentado", "Alto", "Muy alto"] as const)[clampNivel(n)];
}

function estiloNivel(nivel: Nivel) {
  if (nivel === "Bajo") return { bg: "#f0fdf4", text: "#166534", badge: "secondary" as const };
  if (nivel === "Aumentado") return { bg: "#fef9c3", text: "#854d0e", badge: "outline" as const };
  if (nivel === "Alto") return { bg: "#fee2e2", text: "#991b1b", badge: "destructive" as const };
  return { bg: "#ffe4e6", text: "#881337", badge: "destructive" as const };
}

function puntajePorCintura(sexo: string | null | undefined, cinturaCm: number) {
  const s = (sexo ?? "").toUpperCase();

  // Estratos usados frecuentemente:
  // H: <94 bajo, 94-102 aumentado, >102 alto
  // M: <80 bajo, 80-88 aumentado, >88 alto
  let a = 94, h = 102;
  if (s === "F") { a = 80; h = 88; }
  if (s === "M") { a = 94; h = 102; }

  if (cinturaCm >= h) return 2;
  if (cinturaCm >= a) return 1;
  return 0;
}

function puntajePorWHtR(cinturaCm: number, alturaCm: number) {
  const whtr = cinturaCm / alturaCm; // ambos en cm
  // Regla práctica: WHtR >= 0.5 aumenta riesgo
  if (whtr >= 0.6) return 2;
  if (whtr >= 0.5) return 1;
  return 0;
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
  if (!cinturaCm || cinturaCm <= 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Cargá cintura para estimar riesgo cardiometabólico.
      </div>
    );
  }

  const razones: string[] = [];

  // Base: cintura por sexo
  const sCintura = puntajePorCintura(sexo ?? null, cinturaCm);
  if (sCintura === 2) razones.push("cintura alta");
  else if (sCintura === 1) razones.push("cintura aumentada");
  else razones.push("cintura en rango");

  // WHtR si hay altura
  let sWhtr = 0;
  let whtr: number | null = null;
  if (alturaCm && alturaCm > 0) {
    sWhtr = puntajePorWHtR(cinturaCm, alturaCm);
    whtr = cinturaCm / alturaCm;
    if (sWhtr === 2) razones.push("WHtR muy alto (≥0.60)");
    else if (sWhtr === 1) razones.push("WHtR alto (≥0.50)");
  } else {
    razones.push("faltó altura (no WHtR)");
  }

  // IMC como amplificador
  let amp = 0;
  if (imc !== null && imc !== undefined) {
    if (imc >= 30) { amp = 1; razones.push("IMC ≥ 30"); }
    else if (imc >= 25) { razones.push("IMC ≥ 25"); }
  }

  // Puntaje total
  // cintura (0-2) + WHtR (0-2) + amplificador IMC (0-1)
  const total = sCintura + sWhtr + amp;

  // Mapeo a niveles (0-1 bajo, 2 aumentado, 3-4 alto, 5 muy alto)
  let nivelNum = 0;
  if (total <= 1) nivelNum = 0;
  else if (total === 2) nivelNum = 1;
  else if (total <= 4) nivelNum = 2;
  else nivelNum = 3;

  const nivel = nivelToLabel(nivelNum);
  const st = estiloNivel(nivel);

  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        border: "1px solid #e5e5e5",
        background: st.bg,
        color: st.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Riesgo cardiometabólico</div>
        <Badge variant={st.badge} className="text-black">{nivel}</Badge>
      </div>

      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.92 }}>
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

      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.88 }}>
        Señales: {razones.join(" + ")}.
      </div>

      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
        Orientativo (cintura por sexo + WHtR + IMC). No reemplaza evaluación clínica.
      </div>
    </div>
  );
}
