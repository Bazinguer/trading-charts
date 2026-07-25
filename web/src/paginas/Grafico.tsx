import { useEffect, useState } from "react"
import { ChartCandlestick, ChartLine, ChevronLeft } from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"

import { GraficoVelas, type Intervalo, type TipoGrafico } from "@/components/GraficoVelas"
import { Button } from "@/components/ui/button"
import { api, type ResumenSimbolo } from "@/lib/api"

const INTERVALOS: { valor: Intervalo; etiqueta: string }[] = [
  { valor: "1d", etiqueta: "1D" },
  { valor: "1w", etiqueta: "1S" },
  { valor: "1M", etiqueta: "1M" },
]

const TIPOS: { valor: TipoGrafico; etiqueta: string; Icono: typeof ChartCandlestick }[] = [
  { valor: "velas", etiqueta: "Velas", Icono: ChartCandlestick },
  { valor: "linea", etiqueta: "Línea", Icono: ChartLine },
]

// Preferencia de visualización global (no es análisis del símbolo → localStorage).
const CLAVE_TIPO = "tc-tipo-grafico"

export function Grafico() {
  const { simbolo = "BTCUSDT" } = useParams()
  const { state } = useLocation()
  const [intervalo, setIntervalo] = useState<Intervalo>("1d")
  const [tipo, setTipo] = useState<TipoGrafico>(() =>
    localStorage.getItem(CLAVE_TIPO) === "linea" ? "linea" : "velas",
  )
  const [nombre, setNombre] = useState<string | null>(null)

  const cambiarTipo = (valor: TipoGrafico) => {
    setTipo(valor)
    localStorage.setItem(CLAVE_TIPO, valor)
  }

  const volverA = (state as { from?: string } | null)?.from ?? "/graficos"
  // Patrón DS: el back link nombra el DESTINO, nunca un genérico "Volver".
  const etiquetaVolver = volverA === "/" ? "Inicio" : "Gráficos"

  // Nombre del activo para el título; sin él la página funciona igual.
  useEffect(() => {
    let cancelado = false
    setNombre(null)
    api<ResumenSimbolo[]>(`/api/resumen?simbolos=${encodeURIComponent(simbolo)}`)
      .then((r) => {
        if (!cancelado) setNombre(r[0]?.nombre ?? null)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [simbolo])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Link
        to={volverA}
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {etiquetaVolver}
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">
          {simbolo}
          {nombre && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{nombre}</span>
          )}
        </h1>
        <div className="flex gap-1">
          {INTERVALOS.map((i) => (
            <Button
              key={i.valor}
              size="sm"
              variant={intervalo === i.valor ? "default" : "secondary"}
              onClick={() => setIntervalo(i.valor)}
            >
              {i.etiqueta}
            </Button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex gap-1">
          {TIPOS.map((t) => (
            <Button
              key={t.valor}
              size="icon-sm"
              variant={tipo === t.valor ? "default" : "secondary"}
              title={t.etiqueta}
              aria-label={t.etiqueta}
              onClick={() => cambiarTipo(t.valor)}
            >
              <t.Icono />
            </Button>
          ))}
        </div>
      </div>
      <GraficoVelas simbolo={simbolo} intervalo={intervalo} tipo={tipo} />
    </div>
  )
}
