import { NextResponse } from "next/server";
import { sesionValida, hayPinConfigurado } from "@/lib/auth";

export async function GET() {
  const sesion = await sesionValida();
  const hayPin = await hayPinConfigurado();
  return NextResponse.json({ sesion, hayPin });
}
