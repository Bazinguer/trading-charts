import { useEffect, useState } from "react"
import {
  ChartCandlestick,
  ChartLine,
  ChartNoAxesCombined,
  ChevronLeft,
  Grid3x3,
} from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"

import { GraficoVelas, type Intervalo, type TipoGrafico } from "@/components/GraficoVelas"
import { Button } from "@/components/ui/button"
import { api, type ResumenSimbolo } from "@/lib/api"

const INTERVALOS: { valor: Intervalo; etiqueta: string }[] = [
  { valor: "1h", etiqueta: "1H" },
  { valor: "4h", etiqueta: "4H" },
  { valor: "1d", etiqueta: "1D" },
  { valor: "1w", etiqueta: "1S" },
  { valor: "1M", etiqueta: "1M" },
]

const TIPOS: { valor: TipoGrafico; etiqueta: string; Icono: typeof ChartCandlestick }[] = [
  { valor: "velas", etiqueta: "Velas", Icono: ChartCandlestick },
  { valor: "linea", etiqueta: "Línea", Icono: ChartLine },
]

// Preferencias de visualización globales (no son análisis del símbolo → localStorage).
const CLAVE_TIPO = "tc-tipo-grafico"
const CLAVE_REJILLA = "tc-rejilla"

export function Grafico() {
  const { simbolo = "BTCUSDT" } = useParams()
  const { state } = useLocation()
  const [intervalo, setIntervalo] = useState<Intervalo>("1d")
  const [tipo, setTipo] = useState<TipoGrafico>(() =>
    localStorage.getItem(CLAVE_TIPO) === "linea" ? "linea" : "velas",
  )
  // Rejilla OCULTA por defecto: el lienzo limpio es la norma.
  const [rejilla, setRejilla] = useState(() => localStorage.getItem(CLAVE_REJILLA) === "1")
  const [indicadoresAbierto, setIndicadoresAbierto] = useState(false)
  const [nombre, setNombre] = useState<string | null>(null)

  const cambiarTipo = (valor: TipoGrafico) => {
    setTipo(valor)
    localStorage.setItem(CLAVE_TIPO, valor)
  }

  const cambiarRejilla = () => {
    setRejilla((visible) => {
      localStorage.setItem(CLAVE_REJILLA, visible ? "0" : "1")
      return !visible
    })
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
      <div className="flex flex-wrap items-center gap-3 gap-y-2">
        <h1 className="min-w-0 max-w-full truncate text-lg font-semibold">
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
          <Button
            size="icon-sm"
            variant={rejilla ? "default" : "secondary"}
            title="Rejilla"
            aria-label="Rejilla"
            aria-pressed={rejilla}
            onClick={cambiarRejilla}
          >
            <Grid3x3 />
          </Button>
        </div>
        <div className="h-5 w-px bg-border" />
        <Button size="sm" variant="secondary" onClick={() => setIndicadoresAbierto(true)}>
          <ChartNoAxesCombined />
          Indicadores
        </Button>
      </div>
      {/* key: cambiar de símbolo debe remontar el gráfico y su estado
          (indicadores) desde cero, nunca arrastrar los del símbolo anterior */}
      <GraficoVelas
        key={simbolo}
        simbolo={simbolo}
        intervalo={intervalo}
        tipo={tipo}
        rejilla={rejilla}
        indicadoresAbierto={indicadoresAbierto}
        onIndicadoresAbierto={setIndicadoresAbierto}
      />
    </div>
  )
}
