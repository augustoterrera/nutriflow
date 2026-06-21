"use client";

import { useEffect, useMemo, useState } from "react";
import { clasificarIMC } from "@/lib/calculos";
import { cn } from "@/lib/utils";

// Estado clínico → tokens semánticos (fondo tenue + texto/borde del mismo matiz)
const estiloPorClase: Record<string, string> = {
    ok: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    danger: "border-destructive/20 bg-destructive/10 text-destructive",
    muted: "border-border bg-muted/40 text-muted-foreground",
};

export function ImcCard({
    imc,
    fecha,
}: {
    imc: number;
    fecha?: string | null;
}) {
    const clasificacion = useMemo(() => {
        const { categoria, claseCss } = clasificarIMC(imc);
        return { label: categoria, estilo: estiloPorClase[claseCss] ?? estiloPorClase.muted };
    }, [imc]);

    // “flash” corto cuando cambia IMC (o sea, cambió la última medición)
    const [flash, setFlash] = useState(false);
    useEffect(() => {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 700);
        return () => clearTimeout(t);
    }, [imc]);

    return (
        <div
            className={cn(
                "rounded-lg border p-3 transition-all duration-500",
                clasificacion.estilo,
                flash && "scale-[1.02] shadow-lg"
            )}
        >
            <div className="font-bold">
                IMC: {imc.toFixed(1)} · {clasificacion.label}
            </div>

            <div className="mt-0.5 text-xs opacity-90">
                {fecha ? <>Última medición: {fecha}</> : <>Última medición</>}
            </div>
        </div>
    );
}
