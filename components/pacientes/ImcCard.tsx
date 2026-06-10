"use client";

import { useEffect, useMemo, useState } from "react";

type Clasificacion = {
    label: string;
    bg: string;
    text: string;
};

function clasificarIMC(imc: number): Clasificacion {
    if (imc < 18.5) return { label: "Bajo peso", bg: "#fff7ed", text: "#9a3412" };
    if (imc < 25) return { label: "Normal", bg: "#f0fdf4", text: "#166534" };
    if (imc < 30) return { label: "Sobrepeso", bg: "#fef9c3", text: "#854d0e" };
    return { label: "Obesidad", bg: "#fee2e2", text: "#991b1b" };
}

export function ImcCard({
    imc,
    fecha,
}: {
    imc: number;
    fecha?: string | null;
}) {
    const clasificacion = useMemo(() => clasificarIMC(imc), [imc]);

    // “flash” corto cuando cambia IMC (o sea, cambió la última medición)
    const [flash, setFlash] = useState(false);
    useEffect(() => {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 700);
        return () => clearTimeout(t);
    }, [imc]);

    return (
        <div
            style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e5e5",
                background: clasificacion.bg,
                color: clasificacion.text,

                // transición suave de colores
                transition: "background-color 450ms ease, color 450ms ease, box-shadow 450ms ease, transform 450ms ease",
                // efecto “flash” al cambiar
                boxShadow: flash
                    ? "0 10px 30px rgba(0,0,0,0.18), 0 0 0 6px rgba(0,0,0,0.06)"
                    : "0 0 0 rgba(0,0,0,0)",
                transform: flash ? "scale(1.03)" : "scale(1)",

            }}
        >
            <div style={{ fontWeight: 700 }}>
                IMC: {imc.toFixed(1)} · {clasificacion.label}
            </div>

            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                {fecha ? <>Última medición: {fecha}</> : <>Última medición</>}
            </div>
        </div>
    );
}
