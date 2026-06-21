import Link from "next/link";
import { getDB } from "@/lib/db";
import {
  Apple,
  ChevronRight,
  Search,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const atajos = [
  { label: "Buscar paciente", href: "/dashboard/pacientes", icon: Search },
  { label: "Cargar nuevo paciente", href: "/dashboard/pacientes/nuevo", icon: UserPlus },
  { label: "Calculadora energética", href: "/dashboard/calculadora", icon: Zap },
  { label: "Banco de alimentos", href: "/dashboard/alimentos", icon: Apple },
];

export default async function DashboardPage() {
  const db = await getDB();

  const pacientesRow = await db.get(`select count(*) as total from pacientes where activo = 1`);
  const anamnesisRow = await db.get(
    `select count(*) as total
     from anamnesis a
     join pacientes p on p.id = a.paciente_id
     where p.activo = 1`
  );
  const planesRow = await db.get(
    `select count(*) as total
     from planes pl
     join pacientes p on p.id = pl.paciente_id
     where p.activo = 1`
  );

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
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="Resumen rápido del consultorio."
        actions=""
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pacientes"
          value={totalPacientes}
          hint="Activos cargados en el sistema"
        />
        <StatCard
          label="Anamnesis"
          value={totalAnamnesis}
          hint="Registros históricos"
        />
        <StatCard
          label="Planes"
          value={totalPlanes}
          hint="Planes alimentarios creados"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Atajos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {atajos.map((a) => (
              <Button
                key={a.href}
                variant="outline"
                className="justify-start"
                asChild
              >
                <Link href={a.href}>
                  <a.icon />
                  {a.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimos pacientes</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/pacientes">Ver todos</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {ultimosPacientes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Todavía no hay pacientes"
              description="Creá el primero para empezar a trabajar."
              action={
                <Button asChild>
                  <Link href="/dashboard/pacientes/nuevo">Nuevo paciente</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {ultimosPacientes.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/dashboard/pacientes/${p.id}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 rounded-md border p-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.nombre_completo}</div>
                    <div className="text-muted-foreground text-sm">DNI: {p.dni}</div>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
