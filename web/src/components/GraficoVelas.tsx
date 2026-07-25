import { useEffect, useRef, useState } from "react"
import { dispose, init } from "klinecharts"
import type { Chart } from "klinecharts"

import { AjustesIndicador } from "@/components/AjustesIndicador"
import { BarraHerramientas } from "@/components/BarraHerramientas"
import { SelectorIndicadores } from "@/components/SelectorIndicadores"
import { useTema } from "@/contextos/tema"
import { api, apiPut, ErrorApi } from "@/lib/api"
import {
  estilosBase,
  estilosLineas,
  FEATURE_AJUSTES,
  FEATURE_QUITAR,
} from "@/lib/estilosGrafico"
import type { EntradaCatalogo, Indicador } from "@/lib/indicadores"

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

const plural = (n: number, palabra: string) =>
  `${n} ${n === 1 ? palabra : palabra + (/[aeiou]$/.test(palabra) ? "s" : "es")}`

// Etiquetas de las líneas de un indicador vivo ("MA10", "DIF"...), derivadas
// de sus figures: valen de rótulo en ajustes y de conteo para los estilos.
function lineasDe(chart: Chart, name: string): string[] {
  const vivo = chart.getIndicators({ name })[0]
  if (!vivo) return []
  return vivo.figures
    .filter((figura) => (figura.type ?? "line") === "line")
    .map((figura) => (figura.title ?? figura.key).replace(/:\s*$/, ""))
}

// Re-aplica color/grosor personalizados sobre las líneas del indicador vivo.
function aplicarEstilosLineas(chart: Chart, ind: Indicador) {
  if (!ind.colores?.some(Boolean) && !ind.grosor) return
  const numLineas = lineasDe(chart, ind.name).length
  if (numLineas === 0) return
  chart.overrideIndicator({
    name: ind.name,
    styles: estilosLineas(chart, ind.colores ?? [], ind.grosor, numLineas),
  })
}

// Crea un indicador en el chart y devuelve su estado real (con los calcParams
// por defecto que ponga la librería si no venían dados). Un indicador por
// nombre como máximo: así quitar/editar no necesita rastrear paneIds.
function crearIndicador(
  chart: Chart,
  entrada: { name: string; panel: boolean; calcParams?: number[] } & Partial<Indicador>,
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
  const ind: Indicador = {
    name: entrada.name,
    panel: entrada.panel,
    calcParams: (vivo?.calcParams as number[] | undefined) ?? entrada.calcParams ?? [],
    ...(entrada.colores ? { colores: entrada.colores } : {}),
    ...(entrada.grosor ? { grosor: entrada.grosor } : {}),
  }
  aplicarEstilosLineas(chart, ind)
  return ind
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
  rejilla,
  indicadoresAbierto,
  onIndicadoresAbierto,
}: {
  simbolo: string
  intervalo: Intervalo
  tipo: TipoGrafico
  rejilla: boolean
  indicadoresAbierto: boolean
  onIndicadoresAbierto: (abierto: boolean) => void
}) {
  const { claro } = useTema()
  const tema = claro ? ("claro" as const) : ("oscuro" as const)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [estado, setEstado] = useState("")
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [ajustesDe, setAjustesDe] = useState<string | null>(null)

  // Refs para que la inicialización (efecto con deps [simbolo, intervalo])
  // aplique las preferencias vigentes sin re-crear el gráfico cuando cambian.
  const tipoRef = useRef(tipo)
  tipoRef.current = tipo
  const temaRef = useRef(tema)
  temaRef.current = tema
  const rejillaRef = useRef(rejilla)
  rejillaRef.current = rejilla

  useEffect(() => {
    chartRef.current?.setStyles(estilosBase(tema, rejilla))
  }, [tema, rejilla])

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
      chart.setStyles(estilosBase(temaRef.current, rejillaRef.current))
      chart.setStyles(estiloVelas(tipoRef.current))

      // Rueda (⚙) y quitar (✕) de la leyenda de cada indicador. Diferido con
      // setTimeout: si el diálogo monta DURANTE el mousedown del canvas, ese
      // mismo evento llega al document y Radix lo trata como click fuera
      // (cierre inmediato); además, mutar paneles en pleno dispatch es frágil.
      chart.subscribeAction("onIndicatorTooltipFeatureClick", (data) => {
        const info = data as { indicator?: { name?: string }; feature?: { id?: string } }
        const name = info.indicator?.name
        if (!name) return
        if (info.feature?.id === FEATURE_QUITAR) setTimeout(() => quitarIndicador(name), 0)
        else if (info.feature?.id === FEATURE_AJUSTES) setTimeout(() => setAjustesDe(name), 0)
      })
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
      if (overlays.length > 0) partes.push(plural(overlays.length, "dibujo"))
      if (aplicados.length > 0) partes.push(plural(aplicados.length, "indicador"))
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

  // Los handlers leen SIEMPRE de indicadoresRef: también se invocan desde la
  // suscripción del chart (closure del primer render, estado congelado).
  const anadirIndicador = (entrada: EntradaCatalogo) => {
    const chart = chartRef.current
    const vivos = indicadoresRef.current ?? []
    if (!chart || vivos.some((i) => i.name === entrada.name)) return
    actualizarIndicadores([...vivos, crearIndicador(chart, entrada)])
  }

  const quitarIndicador = (name: string) => {
    chartRef.current?.removeIndicator({ name })
    actualizarIndicadores((indicadoresRef.current ?? []).filter((i) => i.name !== name))
    setAjustesDe((abierto) => (abierto === name ? null : abierto))
  }

  const cambiarParams = (name: string, calcParams: number[]) => {
    const chart = chartRef.current
    if (!chart) return
    chart.overrideIndicator({ name, calcParams })
    const nuevos = (indicadoresRef.current ?? []).map((i) =>
      i.name === name ? { ...i, calcParams } : i,
    )
    actualizarIndicadores(nuevos)
    // El número de líneas puede cambiar con los params (p. ej. añadir una MA).
    const ind = nuevos.find((i) => i.name === name)
    if (ind) aplicarEstilosLineas(chart, ind)
  }

  const cambiarEstilo = (name: string, colores: (string | null)[], grosor?: number) => {
    const chart = chartRef.current
    if (!chart) return
    const numLineas = lineasDe(chart, name).length
    if (numLineas > 0) {
      chart.overrideIndicator({ name, styles: estilosLineas(chart, colores, grosor, numLineas) })
    }
    const coloresLimpios = colores.some(Boolean) ? colores : undefined
    actualizarIndicadores(
      (indicadoresRef.current ?? []).map((i) =>
        i.name === name ? { ...i, colores: coloresLimpios, grosor } : i,
      ),
    )
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
      const partes = [plural(overlays.length, "dibujo")]
      if (indicadores.length > 0) partes.push(plural(indicadores.length, "indicador"))
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
      <BarraHerramientas onDibujar={dibujar} onGuardar={() => void guardar()} onLimpiar={limpiar} />

      <div className="relative min-w-0 flex-1">
        <div ref={contenedorRef} className="h-full w-full" />
        {estado && (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md border bg-card/90 px-2 py-1 text-xs text-muted-foreground">
            {estado}
          </span>
        )}
      </div>

      <SelectorIndicadores
        abierto={indicadoresAbierto}
        onAbierto={onIndicadoresAbierto}
        activos={indicadores}
        onAnadir={anadirIndicador}
        onQuitar={quitarIndicador}
        onParams={cambiarParams}
        onAjustes={setAjustesDe}
      />

      <AjustesIndicador
        indicador={indicadores.find((i) => i.name === ajustesDe) ?? null}
        lineas={ajustesDe && chartRef.current ? lineasDe(chartRef.current, ajustesDe) : []}
        onCerrar={() => setAjustesDe(null)}
        onCambiar={cambiarEstilo}
      />
    </div>
  )
}
