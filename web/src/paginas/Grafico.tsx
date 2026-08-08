import { useEffect, useState } from "react"
import {
  ChartCandlestick,
  ChartLine,
  ChartNoAxesCombined,
  ChevronLeft,
  Grid3x3,
  Moon,
} from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"

import {
  GraficoVelas,
  type Escala,
  type Intervalo,
  type TipoGrafico,
} from "@/components/GraficoVelas"
import { Button } from "@/components/ui/button"
import { api, type ResumenSimbolo } from "@/lib/api"
import { claseSigno, porcentaje, precio } from "@/lib/formato"
import { cn } from "@/lib/utils"

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
// La ESCALA no está aquí a propósito: es parte del análisis y se guarda por
// símbolo en la BD, junto a dibujos e indicadores (ver GraficoVelas).
const CLAVE_TIPO = "tc-tipo-grafico"
const CLAVE_REJILLA = "tc-rejilla"

// Pantallas de consulta (móvil, vertical u horizontal): ficha estable con
// precio grande y gráfico de solo-lectura (dibujos bloqueados, sin paneles).
// El análisis se hace en PC. Es el inverso de la variante CSS 'dibujo' y,
// como en Inicio, se evalúa al cargar el módulo.
const CONSULTA = window.matchMedia("(max-width: 767px), (max-height: 500px)").matches

function BotonesIntervalo({
  intervalo,
  alCambiar,
}: {
  intervalo: Intervalo
  alCambiar: (i: Intervalo) => void
}) {
  return (
    <div className="flex gap-1">
      {INTERVALOS.map((i) => (
        <Button
          key={i.valor}
          size="sm"
          variant={intervalo === i.valor ? "default" : "secondary"}
          onClick={() => alCambiar(i.valor)}
        >
          {i.etiqueta}
        </Button>
      ))}
    </div>
  )
}

function BotonesTipo({
  tipo,
  alCambiar,
}: {
  tipo: TipoGrafico
  alCambiar: (t: TipoGrafico) => void
}) {
  return (
    <div className="flex gap-1">
      {TIPOS.map((t) => (
        <Button
          key={t.valor}
          size="icon-sm"
          variant={tipo === t.valor ? "default" : "secondary"}
          title={t.etiqueta}
          aria-label={t.etiqueta}
          onClick={() => alCambiar(t.valor)}
        >
          <t.Icono />
        </Button>
      ))}
    </div>
  )
}

// Texto en vez de icono: ningún pictograma comunica "escala logarítmica" mejor
// que la palabra, y es lo que usa TradingView.
function BotonEscala({
  escala,
  alCambiar,
}: {
  escala: Escala
  alCambiar: (e: Escala) => void
}) {
  const log = escala === "log"
  return (
    <Button
      size="sm"
      variant={log ? "default" : "secondary"}
      title="Escala logarítmica"
      aria-pressed={log}
      onClick={() => alCambiar(log ? "lineal" : "log")}
    >
      LOG
    </Button>
  )
}

export function Grafico() {
  const { simbolo = "BTCUSDT" } = useParams()
  const { state } = useLocation()
  const [intervalo, setIntervalo] = useState<Intervalo>("1d")
  const [tipo, setTipo] = useState<TipoGrafico>(() =>
    localStorage.getItem(CLAVE_TIPO) === "linea" ? "linea" : "velas",
  )
  // Rejilla OCULTA por defecto: el lienzo limpio es la norma.
  const [rejilla, setRejilla] = useState(() => localStorage.getItem(CLAVE_REJILLA) === "1")
  // Arranca en lineal y GraficoVelas la corrige con la guardada del símbolo en
  // cuanto carga su análisis (los símbolos sin nada guardado se quedan así).
  const [escala, setEscala] = useState<Escala>("lineal")
  const [indicadoresAbierto, setIndicadoresAbierto] = useState(false)
  const [resumen, setResumen] = useState<ResumenSimbolo | null>(null)

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

  // Nombre y cotización para el título/ficha; sin ellos la página funciona igual.
  useEffect(() => {
    let cancelado = false
    setResumen(null)
    api<ResumenSimbolo[]>(`/api/resumen?simbolos=${encodeURIComponent(simbolo)}`)
      .then((r) => {
        if (!cancelado) setResumen(r[0] ?? null)
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

      {CONSULTA ? (
        // Ficha de consulta (estilo Investing): precio grande, sin controles arriba.
        <div className="flex flex-col gap-0.5">
          <h1 className="min-w-0 max-w-full truncate text-base font-semibold">
            {simbolo}
            {resumen?.nombre && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {resumen.nombre}
              </span>
            )}
          </h1>
          {resumen?.ultimo != null && (
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-2xl font-semibold">{precio(resumen.ultimo)}</span>
              {resumen.var_pct != null && (
                <span className={cn("text-sm font-medium", claseSigno(resumen.var_pct))}>
                  {porcentaje(resumen.var_pct)}
                </span>
              )}
            </div>
          )}
          {resumen?.ampliado != null && (
            <p className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
              <Moon className="h-3 w-3" aria-hidden="true" />
              {precio(resumen.ampliado)}
              {resumen.ampliado_pct != null && (
                <span className={claseSigno(resumen.ampliado_pct)}>
                  {porcentaje(resumen.ampliado_pct)}
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 gap-y-2">
          <h1 className="min-w-0 max-w-full truncate text-lg font-semibold">
            {simbolo}
            {resumen?.nombre && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {resumen.nombre}
              </span>
            )}
          </h1>
          <BotonesIntervalo intervalo={intervalo} alCambiar={setIntervalo} />
          <div className="h-5 w-px bg-border" />
          <div className="flex gap-1">
            <BotonesTipo tipo={tipo} alCambiar={cambiarTipo} />
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
            <BotonEscala escala={escala} alCambiar={setEscala} />
          </div>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="secondary" onClick={() => setIndicadoresAbierto(true)}>
            <ChartNoAxesCombined />
            Indicadores
          </Button>
        </div>
      )}

      {/* key: cambiar de símbolo debe remontar el gráfico y su estado
          (indicadores) desde cero, nunca arrastrar los del símbolo anterior */}
      <GraficoVelas
        key={simbolo}
        simbolo={simbolo}
        intervalo={intervalo}
        tipo={tipo}
        rejilla={rejilla}
        escala={escala}
        onEscala={setEscala}
        sinPaneles={CONSULTA}
        modoConsulta={CONSULTA}
        indicadoresAbierto={indicadoresAbierto}
        onIndicadoresAbierto={setIndicadoresAbierto}
      />

      {CONSULTA && (
        <div className="flex flex-wrap items-center gap-2">
          <BotonesIntervalo intervalo={intervalo} alCambiar={setIntervalo} />
          <div className="h-5 w-px bg-border" />
          <BotonesTipo tipo={tipo} alCambiar={cambiarTipo} />
          <BotonEscala escala={escala} alCambiar={setEscala} />
        </div>
      )}
    </div>
  )
}
