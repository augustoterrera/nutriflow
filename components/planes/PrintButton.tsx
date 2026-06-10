"use client";

export function PrintButton() {
  return (
    <button className="no-print mb-4 rounded-md bg-[#1B4332] px-4 py-2 text-white" type="button" onClick={() => window.print()}>
      Guardar como PDF
    </button>
  );
}
