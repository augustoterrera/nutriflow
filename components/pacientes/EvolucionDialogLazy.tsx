"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const EvolucionDialogLazy = dynamic(
  () => import("@/components/pacientes/EvolucionDialog").then((mod) => mod.EvolucionDialog),
  { ssr: false, loading: () => <Skeleton className="m-2 h-10 w-32" /> }
);
