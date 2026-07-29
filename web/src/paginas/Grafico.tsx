import { useEffect, useRef, useState } from "react"
import {
  ChartCandlestick,
  ChartLine,
  ChartNoAxesCombined,
  ChevronLeft,
  Grid3x3,
  Maximize2,
  Moon,
  X,
} from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"

import { GraficoVelas, type Intervalo, type TipoGrafico } from "@/components/GraficoVelas"
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
const CLAVE_TIPO = "tc-tipo-grafico"
const CLAVE_REJILLA = "tc-rejilla"

// Pantallas de consulta (móvil, vertical u horizontal): ficha con precio
// grande y gráfico limpio + botón de expandir a pantalla completa apaisada.
// Es el inverso de la variante CSS 'dibujo' y, como en Inicio, se evalúa al
// cargar el módulo.
const CONSULTA = window.matchMedia("(max-width: 767px), (max-height: 500px)").matches

// El giro automático a apaisado solo existe en Android (y exige fullscreen);
// en iOS/escritorio los métodos pueden no existir: todo es mejor-esfuerzo.
const orientacion = screen.orientation as ScreenOrientation & {
  lock?: (modo: "landscape") => Promise<void>
  unlock?: () => void
}

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
  const [resumen, setResumen] = useState<ResumenSimbolo | null>(null)
  const [expandido, setExpandido] = useState(false)
  // Expandido: los paneles de indicadores pueden colapsarse para dejar todo
  // el alto al precio (en apaisado de móvil se lo comen).
  const [conPaneles, setConPaneles] = useState(true)
  const lienzoRef = useRef<HTMLDivElement>(null)

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

  const expandir = async () => {
    const el = lienzoRef.current
    if (!el) return
    try {
      await el.requestFullscreen()
    } catch {
      return // sin API de fullscreen no hay modo expandido
    }
    setExpandido(true)
    try {
      await orientacion.lock?.("landscape")
    } catch {
      // El navegador no deja girar: el usuario gira el móvil a mano.
    }
  }

  const cerrarExpandido = () => {
    void document.exitFullscreen().catch(() => {})
  }

  // La salida real puede venir del botón, del gesto atrás o de Escape: el
  // estado se sincroniza siempre desde el evento, nunca desde el botón.
  useEffect(() => {
    const alCambiarFullscreen = () => {
      if (document.fullscreenElement) return
      setExpandido(false)
      try {
        orientacion.unlock?.()
      } catch {
        // nada que desbloquear
      }
    }
    document.addEventListener("fullscreenchange", alCambiarFullscreen)
    return () => document.removeEventListener("fullscreenchange", alCambiarFullscreen)
  }, [])

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
          </div>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="secondary" onClick={() => setIndicadoresAbierto(true)}>
            <ChartNoAxesCombined />
            Indicadores
          </Button>
        </div>
      )}

      {/* Contenedor que pasa a fullscreen al expandir la ficha */}
      <div
        ref={lienzoRef}
        className={cn("flex min-h-0 flex-1 flex-col", expandido && "gap-2 bg-background p-2")}
      >
        {expandido && (
          <div className="flex items-center gap-2">
            <BotonesIntervalo intervalo={intervalo} alCambiar={setIntervalo} />
            <div className="h-5 w-px bg-border" />
            <BotonesTipo tipo={tipo} alCambiar={cambiarTipo} />
            <Button
              size="icon-sm"
              variant={conPaneles ? "default" : "secondary"}
              title="Paneles de indicadores"
              aria-label="Paneles de indicadores"
              aria-pressed={conPaneles}
              onClick={() => setConPaneles((v) => !v)}
            >
              <ChartNoAxesCombined />
            </Button>
            <Button
              size="icon-sm"
              variant="secondary"
              className="ml-auto"
              title="Salir de pantalla completa"
              aria-label="Salir de pantalla completa"
              onClick={cerrarExpandido}
            >
              <X />
            </Button>
          </div>
        )}
        {/* key: cambiar de símbolo (o expandir/plegar la ficha) debe remontar
            el gráfico y su estado (indicadores) desde cero, nunca arrastrar
            los del estado anterior */}
        <GraficoVelas
          key={CONSULTA ? `${simbolo}:${expandido ? `completo:${conPaneles}` : "ficha"}` : simbolo}
          simbolo={simbolo}
          intervalo={intervalo}
          tipo={tipo}
          rejilla={rejilla}
          sinPaneles={CONSULTA && (!expandido || !conPaneles)}
          modoConsulta={CONSULTA}
          indicadoresAbierto={indicadoresAbierto}
          onIndicadoresAbierto={setIndicadoresAbierto}
        />
      </div>

      {CONSULTA && !expandido && (
        <div className="flex items-center gap-2">
          <BotonesIntervalo intervalo={intervalo} alCambiar={setIntervalo} />
          <div className="h-5 w-px bg-border" />
          <BotonesTipo tipo={tipo} alCambiar={cambiarTipo} />
          <Button
            size="icon-sm"
            variant="secondary"
            className="ml-auto"
            title="Pantalla completa"
            aria-label="Pantalla completa"
            onClick={() => void expandir()}
          >
            <Maximize2 />
          </Button>
        </div>
      )}
    </div>
  )
}
