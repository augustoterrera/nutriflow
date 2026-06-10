import Link from "next/link";
import type { ReactNode } from "react";
import { getDB } from "@/lib/db";
import { Apple, Calculator, ClipboardList, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const db = await getDB();

  const pacientesRow = await db.get(`select count(*) as total from pacientes where activo = 1`);
  const anamnesisRow = await db.get(`select count(*) as total from anamnesis`);
  const planesRow = await db.get(`select count(*) as total from planes`);

  const totalPacientes = pacientesRow?.total ?? 0;
  const totalAnamnesis = anamnesisRow?.total ?? 0;
  const totalPlanes = planesRow?.total ?? 0;

  const ultimosPacientes = await db.all(
    `select id, dni, nombre_completo
     from pacientes
     where activo = 1
     order by datetime(creado_en) desc, id desc
     limit 5`
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen rápido del consultorio.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild className="bg-primary border-2">
            <Link href="/dashboard/pacientes/nuevo">Nuevo paciente</Link>
          </Button>
          <Button variant="secondary" asChild className="bg-primary border-2">
            <Link href="/dashboard/pacientes">Ver pacientes</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalPacientes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Activos cargados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anamnesis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalAnamnesis}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Registros históricos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planes creados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalPlanes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Planes alimentarios guardados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ToolLink href="/dashboard/pacientes" icon={<Users />} title="Pacientes" />
        <ToolLink href="/dashboard/pacientes/nuevo" icon={<ClipboardList />} title="Nuevo paciente" />
        <ToolLink href="/dashboard/calculadora" icon={<Calculator />} title="Calculadora" />
        <ToolLink href="/dashboard/alimentos" icon={<Apple />} title="Alimentos" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimos pacientes</CardTitle>
          <Button variant="secondary" size="sm" asChild className="border-2 border-gray-700">
            <Link href="/dashboard/pacientes">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ultimosPacientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay pacientes. Creá el primero para empezar.
            </p>
          ) : (
            <div className="space-y-2">
              {ultimosPacientes.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/dashboard/pacientes/${p.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.nombre_completo}</div>
                    <div className="text-sm text-muted-foreground">DNI: {p.dni}</div>
                  </div>
                  <span className="text-sm text-muted-foreground border-2 p-2 border-gray-700 rounded-2xl">Abrir</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToolLink(props: { href: string; icon: ReactNode; title: string }) {
  return (
    <Link href={props.href} className="flex items-center gap-3 rounded-md border bg-card p-4 font-medium hover:bg-accent">
      <span className="[&_svg]:size-5">{props.icon}</span>
      {props.title}
    </Link>
  );
}
