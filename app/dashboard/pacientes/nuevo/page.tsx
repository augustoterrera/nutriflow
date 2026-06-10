import Link from "next/link";
import { crearPacienteAction } from "./actions";
import { DatePickerSimple } from "@/components/pacientes/Date-picker";

export default function NuevoPacientePage() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}> {/* Aumenté un poco el maxWidth para que luzca mejor en dos columnas */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Nuevo paciente</h1>
        <Link
          href="/dashboard/pacientes"
          style={{ marginLeft: "auto" }}
          className="bg-slate-800 border-2 rounded-md p-2"
        >
          Volver
        </Link>
      </div>

      <form
        action={crearPacienteAction}
        style={{ 
          display: "grid", 
          gap: "16px", 
          gridTemplateColumns: "repeat(2, 1fr)" // Esto crea las dos columnas
        }}
      >
        {/* Los inputs que quieres que ocupen todo el ancho (como el DNI o el Nombre) 
            pueden llevar gridColumn: "span 2" si lo deseas, pero aquí los pondremos de a dos */}
        
        <label style={{ display: "grid", gap: 6 }}>
          <span>DNI (obligatorio)</span>
          <input name="dni" inputMode="numeric" placeholder="Ej: 35123456" required style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre completo (obligatorio)</span>
          <input name="nombre_completo" placeholder="Ej: Juan Pérez" required style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Teléfono</span>
          <input name="telefono" placeholder="Ej: 3815551234" style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Sexo</span>
          <select name="sexo" defaultValue="" style={{ padding: 10 }} className="border rounded border-white">
            <option className="bg-black" value="">Sin especificar</option>
            <option className="bg-black" value="M">Masculino</option>
            <option className="bg-black" value="F">Femenino</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Fecha de nacimiento</span>
          <DatePickerSimple name="fecha_nacimiento"></DatePickerSimple>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input name="email" type="email" placeholder="Ej: roberte@gmail.com" style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Direccion</span>
          <input name="direccion" placeholder="Ej: Av. Siempre Viva 123" style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Ocupacion</span>
          <input name="ocupacion" placeholder="Ej: Profesor" style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Estado civil</span>
          <input name="estado_civil" placeholder="Ej: Soltero" style={{ padding: 10 }} className="border rounded border-white" />
        </label>

        {/* NOTAS Y BOTÓN: Generalmente quedan mejor ocupando todo el ancho */}
        <label style={{ display: "grid", gap: 6, gridColumn: "span 2" }}>
          <span>Notas</span>
          <textarea name="notas" className="border rounded border-white p-2" rows={4}></textarea>
        </label>

        <div style={{ gridColumn: "span 2", display: "grid", gap: 6 }}>
            <button style={{ padding: 10, marginTop: 8 }} className="bg-blue-600 rounded-md">Crear</button>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Tip: si el DNI ya existe, mostraremos un error con <code>error.tsx</code>.
            </p>
        </div>
      </form>
    </div>
  );
}