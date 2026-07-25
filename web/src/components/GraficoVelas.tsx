import { useEffect, useRef, useState } from "react"
import {
  AlignJustify,
  ChartNoAxesCombined,
  Eraser,
  Minus,
  Save,
  Slash,
  Square,
  Type,
} from "lucide-react"
import { dispose, init } from "klinecharts"
import type { Chart } from "klinecharts"

import { SelectorIndicadores } from "@/components/SelectorIndicadores"
import { Button } from "@/components/ui/button"
import { api, apiPut, ErrorApi } from "@/lib/api"
import type { EntradaCatalogo, Indicador } from "@/lib/indicadores"

// Overlays incorporados de KLineChart que exponemos en la barra de dibujo.
const HERRAMIENTAS = [
  { name: "segment", etiqueta: "Tendencia", Icono: Slash },
  { name: "horizontalStraightLine", etiqueta: "Horizontal", Icono: Minus },
  { name: "rect", etiqueta: "Rectángulo", Icono: Square },
  { name: "fibonacciLine", etiqueta: "Fibonacci", Icono: AlignJustify },
  { name: "simpleAnnotation", etiqueta: "Texto", Icono: Type },
]

type Velas = { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[]

export type Intervalo = "1d" | "1w" | "1M"
export type TipoGrafico = "velas" | "linea"

// El período le dice a KLineChart cómo formatear fechas en crosshair/tooltip.
const PERIODOS: Record<Intervalo, { span: number; type: "day" | "month" }> = {
  "1d": { span: 1, type: "day" },
  "1w": { span: 7, type: "day" },
  "1M": { span: 1, type: "month" },
}

// "linea" pinta el cierre como área; tooltip y crosshair siguen dando OHLC.
const estiloVelas = (tipo: TipoGrafico) => ({
  candle: { type: tipo === "linea" ? ("area" as const) : ("candle_solid" as const) },
})

// Crea un indicador en el chart y devuelve su estado real (con los calcParams
// por defecto que ponga la librería si no venían dados). Un indicador por
// nombre como máximo: así quitar/editar no necesita rastrear paneIds.
function crearIndicador(
  chart: Chart,
  entrada: { name: string; panel: boolean; calcParams?: number[] },
): Indicador {
  const creacion = entrada.calcParams?.length
    ? { name: entrada.name, calcParams: entrada.calcParams }
    : { name: entrada.name }
  if (entrada.panel) {
    chart.createIndicator(creacion, false)
  } else {
    chart.createIndicator({ ...creacion, paneId: "candle_pane" }, true)
  }
  const vivo = chart.getIndicators({ name: entrada.name })[0]
  return {
    name: entrada.name,
    panel: entrada.panel,
    calcParams: (vivo?.calcParams as number[] | undefined) ?? entrada.calcParams ?? [],
  }
}

// Del overlay vivo solo persistimos lo que hace falta para reconstruirlo:
// tipo + puntos anclados a tiempo/precio (+ texto de las anotaciones).
type DibujoGuardado = {
  name: string
  points: { timestamp?: number; value?: number }[]
  extendData?: unknown
}

export function GraficoVelas({
  simbolo,
  intervalo,
  tipo,
}: {
  simbolo: string
  intervalo: Intervalo
  tipo: TipoGrafico
}) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [estado, setEstado] = useState("")
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  // Ref para que la inicialización (efecto con deps [simbolo, intervalo])
  // aplique el tipo vigente sin re-crear el gráfico cuando este cambia.
  const tipoRef = useRef(tipo)
  tipoRef.current = tipo

  // null hasta la primera carga: al reiniciar el chart por cambio de intervalo
  // se re-aplican los indicadores vigentes (aunque no estén guardados), no los
  // del servidor. El cambio de símbolo remonta el componente (key en Grafico).
  const indicadoresRef = useRef<Indicador[] | null>(null)
  const actualizarIndicadores = (lista: Indicador[]) => {
    indicadoresRef.current = lista
    setIndicadores(lista)
  }

  useEffect(() => {
    chartRef.current?.setStyles(estiloVelas(tipo))
  }, [tipo])

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    let cancelado = false

    const arrancar = async () => {
      let velas: Velas
      try {
        velas = await api<Velas>(`/api/velas/${encodeURIComponent(simbolo)}?intervalo=${intervalo}`)
      } catch (e) {
        setEstado(`Error cargando velas: ${e instanceof ErrorApi ? e.message : "sin conexión"}`)
        return
      }
      if (cancelado) return

      const chart = init(contenedor)
      if (!chart) return
      chartRef.current = chart
      chart.setSymbol({ ticker: simbolo })
      chart.setPeriod(PERIODOS[intervalo])
      chart.setStyles(estiloVelas(tipoRef.current))
      // Servimos todo el histórico de una vez: la primera llamada recibe la
      // serie completa y las siguientes (scroll hacia atrás) nada.
      let servido = false
      chart.setDataLoader({
        getBars: ({ callback }) => {
          callback(servido ? [] : velas)
          servido = true
        },
      })

      const { overlays, indicadores: guardados } = await api<{
        overlays: DibujoGuardado[]
        indicadores: Indicador[]
      }>(`/api/dibujos/${encodeURIComponent(simbolo)}`)
      if (cancelado) return

      if (overlays.length > 0) chart.createOverlay(overlays)
      const aplicados = (indicadoresRef.current ?? guardados).map((ind) =>
        crearIndicador(chart, ind),
      )
      indicadoresRef.current = aplicados
      setIndicadores(aplicados)

      const partes = []
      if (overlays.length > 0) partes.push(`${overlays.length} dibujos`)
      if (aplicados.length > 0) partes.push(`${aplicados.length} indicadores`)
      if (partes.length > 0) setEstado(`${partes.join(" y ")} restaurados`)
    }

    void arrancar()
    return () => {
      cancelado = true
      chartRef.current = null
      dispose(contenedor)
    }
  }, [simbolo, intervalo])

  const dibujar = (name: string) => {
    const chart = chartRef.current
    if (!chart) return
    if (name === "simpleAnnotation") {
      const texto = window.prompt("Texto de la anotación:")
      if (texto) chart.createOverlay({ name, extendData: texto })
      return
    }
    chart.createOverlay(name)
  }

  const anadirIndicador = (entrada: EntradaCatalogo) => {
    const chart = chartRef.current
    if (!chart || indicadores.some((i) => i.name === entrada.name)) return
    actualizarIndicadores([...indicadores, crearIndicador(chart, entrada)])
  }

  const quitarIndicador = (name: string) => {
    chartRef.current?.removeIndicator({ name })
    actualizarIndicadores(indicadores.filter((i) => i.name !== name))
  }

  const cambiarParams = (name: string, calcParams: number[]) => {
    chartRef.current?.overrideIndicator({ name, calcParams })
    actualizarIndicadores(indicadores.map((i) => (i.name === name ? { ...i, calcParams } : i)))
  }

  const guardar = async () => {
    const chart = chartRef.current
    if (!chart) return
    const overlays: DibujoGuardado[] = chart.getOverlays().map((overlay) => ({
      name: overlay.name,
      points: overlay.points.map((p) => ({ timestamp: p.timestamp, value: p.value })),
      extendData: overlay.extendData,
    }))
    try {
      await apiPut(`/api/dibujos/${encodeURIComponent(simbolo)}`, { overlays, indicadores })
      const partes = [`${overlays.length} dibujos`]
      if (indicadores.length > 0) partes.push(`${indicadores.length} indicadores`)
      setEstado(`Guardado: ${partes.join(" y ")}`)
    } catch {
      setEstado("Error al guardar")
    }
  }

  const limpiar = () => {
    chartRef.current?.removeOverlay()
    setEstado("Dibujos borrados del gráfico (sin guardar)")
  }

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      {/* Barra de herramientas vertical, pegada al borde izquierdo del lienzo */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 rounded-[10px] border bg-card p-1">
        {HERRAMIENTAS.map((h) => (
          <Button
            key={h.name}
            variant="ghost"
            size="icon-sm"
            title={h.etiqueta}
            aria-label={h.etiqueta}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => dibujar(h.name)}
          >
            <h.Icono />
          </Button>
        ))}
        <div className="my-1 h-px w-5 shrink-0 bg-border" />
        <Button
          variant="ghost"
          size="icon-sm"
          title="Indicadores"
          aria-label="Indicadores"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setSelectorAbierto(true)}
        >
          <ChartNoAxesCombined />
        </Button>
        <div className="my-1 h-px w-5 shrink-0 bg-border" />
        <Button
          variant="ghost"
          size="icon-sm"
          title="Guardar análisis"
          aria-label="Guardar análisis"
          className="text-primary hover:text-primary"
          onClick={() => void guardar()}
        >
          <Save />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Limpiar dibujos (sin guardar)"
          aria-label="Limpiar dibujos"
          className="text-muted-foreground hover:text-destructive"
          onClick={limpiar}
        >
          <Eraser />
        </Button>
      </div>

      <div className="relative min-w-0 flex-1">
        <div ref={contenedorRef} className="h-full w-full" />
        {estado && (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md border bg-card/90 px-2 py-1 text-xs text-muted-foreground">
            {estado}
          </span>
        )}
      </div>

      <SelectorIndicadores
        abierto={selectorAbierto}
        onAbierto={setSelectorAbierto}
        activos={indicadores}
        onAnadir={anadirIndicador}
        onQuitar={quitarIndicador}
        onParams={cambiarParams}
      />
    </div>
  )
}
