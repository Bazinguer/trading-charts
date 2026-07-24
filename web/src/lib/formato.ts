/** Formateo financiero es-ES con signo menos tipográfico (−, U+2212). */

export function precio(valor: number): string {
  const decimales = Math.abs(valor) >= 1000 ? 0 : Math.abs(valor) >= 1 ? 2 : 6
  return valor
    .toLocaleString("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    .replace("-", "−")
}

export function porcentaje(valor: number): string {
  const texto = valor
    .toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace("-", "−")
  return `${valor > 0 ? "+" : ""}${texto} %`
}

/** Fecha y hora compactas: dd/mm/aaaa hh:mm. */
export function fechaHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return "—"
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Clase de color por signo: verde sube, rojo baja, neutro ≈0. */
export function claseSigno(valor: number | null | undefined): string {
  if (valor == null || Math.abs(valor) < 0.005) return "text-muted-foreground"
  return valor > 0 ? "text-success" : "text-destructive"
}
