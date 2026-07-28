import { useEffect, useRef, useState } from "react"
import { dispose, init } from "klinecharts"
import type { Chart, DeepPartial, OverlayStyle } from "klinecharts"

import { Settings2, Trash2 } from "lucide-react"

import { AjustesDibujo, type AjustesForma } from "@/components/AjustesDibujo"
import { AjustesIndicador } from "@/components/AjustesIndicador"
import { BarraHerramientas, etiquetaHerramienta } from "@/components/BarraHerramientas"
import { SelectorIndicadores } from "@/components/SelectorIndicadores"
import { Button } from "@/components/ui/button"
import { useTema } from "@/contextos/tema"
import { NIVELES_FIBONACCI, nivelesDeExtra, type ExtraFibonacci } from "@/lib/overlays"
import { cn } from "@/lib/utils"

// Diseño base del Fibonacci: los fibos nuevos parten de estos ajustes.
const CLAVE_FIBO_BASE = "tc-fibo-base"

function leerBaseFibo(): AjustesForma | null {
  try {
    const crudo = localStorage.getItem(CLAVE_FIBO_BASE)
    return crudo ? (JSON.parse(crudo) as AjustesForma) : null
  } catch {
    return null
  }
}
import { api, apiPut, ErrorApi } from "@/lib/api"
import {
  estilosBase,
  estilosDibujo,
  estilosLineas,
  FEATURE_AJUSTES,
  FEATURE_OJO,
  FEATURE_QUITAR,
  lineaDesdeAjustes,
  type EstiloLinea,
} from "@/lib/estilosGrafico"
import type { EntradaCatalogo, Indicador } from "@/lib/indicadores"

type Velas = { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[]

export type Intervalo = "1h" | "4h" | "1d" | "1w" | "1M"
export type TipoGrafico = "velas" | "linea"

// El período le dice a KLineChart cómo formatear fechas en crosshair/tooltip.
const PERIODOS: Record<Intervalo, { span: number; type: "hour" | "day" | "month" }> = {
  "1h": { span: 1, type: "hour" },
  "4h": { span: 4, type: "hour" },
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
  if (entrada.visible === false) {
    chart.overrideIndicator({ name: entrada.name, visible: false })
  }
  const ind: Indicador = {
    name: entrada.name,
    panel: entrada.panel,
    calcParams: (vivo?.calcParams as number[] | undefined) ?? entrada.calcParams ?? [],
    ...(entrada.colores ? { colores: entrada.colores } : {}),
    ...(entrada.grosor ? { grosor: entrada.grosor } : {}),
    ...(entrada.visible === false ? { visible: false } : {}),
  }
  aplicarEstilosLineas(chart, ind)
  return ind
}

// Del overlay vivo solo persistimos lo que hace falta para reconstruirlo:
// tipo + puntos anclados a tiempo/precio (+ extendData: texto de anotaciones
// o niveles del fibonacci; + styles: color/grosor personalizados).
type DibujoGuardado = {
  name: string
  points: { timestamp?: number; value?: number }[]
  extendData?: unknown
  styles?: DeepPartial<OverlayStyle> | null
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
  // Mano cerrada mientras se arrastra el gráfico (estilo TradingView).
  const [arrastrando, setArrastrando] = useState(false)
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [ajustesDe, setAjustesDe] = useState<string | null>(null)
  // Dibujo seleccionado en el lienzo (click sobre él): habilita borrado individual.
  const [seleccionado, setSeleccionado] = useState<{ id: string; name: string } | null>(null)
  // Portapapeles interno de dibujos (Ctrl+C / Ctrl+V).
  const portapapelesRef = useRef<DibujoGuardado | null>(null)
  // Ajustes del dibujo seleccionado; null = diálogo cerrado.
  const [ajustesDibujo, setAjustesDibujo] = useState<AjustesForma | null>(null)

  // Callbacks comunes a todo overlay (nuevo o restaurado): rastrear selección.
  const eventosOverlay = {
    onSelected: (e: { overlay: { id: string; name: string } }) =>
      setSeleccionado({ id: e.overlay.id, name: e.overlay.name }),
    onDeselected: () => {
      setSeleccionado(null)
      setAjustesDibujo(null)
    },
  }

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
      // La primera petición intradía descarga el histórico: puede tardar.
      setEstado("Cargando velas…")
      let velas: Velas
      try {
        velas = await api<Velas>(`/api/velas/${encodeURIComponent(simbolo)}?intervalo=${intervalo}`)
      } catch (e) {
        setEstado(`Error cargando velas: ${e instanceof ErrorApi ? e.message : "sin conexión"}`)
        return
      }
      if (cancelado) return
      setEstado("")

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
        else if (info.feature?.id === FEATURE_OJO) setTimeout(() => alternarVisibilidad(name), 0)
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

      if (overlays.length > 0) {
        chart.createOverlay(overlays.map((o) => ({ ...o, ...eventosOverlay })))
      }
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
      setSeleccionado(null)
      dispose(contenedor)
    }
  }, [simbolo, intervalo])

  const dibujar = (name: string) => {
    const chart = chartRef.current
    if (!chart) return
    // Anotación y etiqueta pintan su extendData como texto: se pide al crear.
    if (name === "simpleAnnotation" || name === "simpleTag") {
      const texto = window.prompt("Texto:")
      if (texto) chart.createOverlay({ name, extendData: texto, ...eventosOverlay })
      return
    }
    // El fibonacci nuevo parte del diseño base fijado por el usuario, si existe.
    if (name === "fibonacciLine") {
      const base = leerBaseFibo()
      if (base) {
        chart.createOverlay({
          name,
          extendData: { niveles: (base.niveles ?? NIVELES_FIBONACCI).join(","), color: base.color },
          styles: { line: lineaDesdeAjustes(base.grosor, base.estilo) },
          ...eventosOverlay,
        })
        return
      }
    }
    chart.createOverlay({ name, ...eventosOverlay })
  }

  const borrarSeleccionado = () => {
    if (!seleccionado) return
    chartRef.current?.removeOverlay({ id: seleccionado.id })
    setSeleccionado(null)
    setAjustesDibujo(null)
    setEstado("Dibujo borrado — guarda para consolidar el cambio")
  }

  // Abre los ajustes del dibujo seleccionado leyendo el overlay vivo.
  const abrirAjustesDibujo = () => {
    const chart = chartRef.current
    if (!chart || !seleccionado) return
    const vivo = chart.getOverlays({ id: seleccionado.id })[0]
    if (!vivo) return
    const linea = (
      vivo.styles as {
        line?: { color?: string; size?: number; style?: string; dashedValue?: number[] }
      } | null
    )?.line
    const estilo: EstiloLinea =
      linea?.style === "dashed"
        ? (linea.dashedValue?.[0] ?? 8) <= 3
          ? "punteada"
          : "discontinua"
        : "continua"
    if (seleccionado.name === "fibonacciLine") {
      // El fibo guarda su color en extendData: null = paleta multicolor por nivel.
      const extra = vivo.extendData as ExtraFibonacci | undefined
      setAjustesDibujo({
        niveles: nivelesDeExtra(extra),
        color: extra?.color ?? null,
        grosor: linea?.size,
        estilo,
      })
      return
    }
    setAjustesDibujo({ color: linea?.color ?? null, grosor: linea?.size, estilo })
  }

  const cambiarAjustesDibujo = (cambios: AjustesForma) => {
    const chart = chartRef.current
    if (!chart || !seleccionado) return
    if (seleccionado.name === "fibonacciLine") {
      // La plantilla del fibo resuelve colores por nivel; aquí solo viajan la
      // config (extendData, niveles como CSV: ver ExtraFibonacci) y
      // grosor/estilo de línea. Color null = multicolor.
      chart.overrideOverlay({
        id: seleccionado.id,
        extendData: {
          niveles: (cambios.niveles ?? NIVELES_FIBONACCI).join(","),
          color: cambios.color,
        },
        styles: { line: lineaDesdeAjustes(cambios.grosor, cambios.estilo) },
      })
    } else {
      chart.overrideOverlay({
        id: seleccionado.id,
        styles: estilosDibujo(chart, cambios.color, cambios.grosor, cambios.estilo),
      })
    }
    setAjustesDibujo(cambios)
  }

  const fijarBaseFibo = () => {
    if (!ajustesDibujo) return
    localStorage.setItem(CLAVE_FIBO_BASE, JSON.stringify(ajustesDibujo))
    setEstado("Diseño base del Fibonacci guardado — los nuevos partirán de él")
  }

  const copiarSeleccionado = () => {
    if (!seleccionado) return
    const vivo = chartRef.current?.getOverlays({ id: seleccionado.id })[0]
    if (!vivo) return
    portapapelesRef.current = {
      name: vivo.name,
      points: vivo.points.map((p) => ({ timestamp: p.timestamp, value: p.value })),
      extendData: vivo.extendData,
      ...(vivo.styles ? { styles: vivo.styles } : {}),
    }
    setEstado(`${etiquetaHerramienta(vivo.name)} copiado — Ctrl+V para pegar`)
  }

  const pegarDibujo = () => {
    const chart = chartRef.current
    const copia = portapapelesRef.current
    if (!chart || !copia) return
    // Desplazado unas velas a la derecha para que se distinga del original.
    const datos = chart.getDataList()
    const delta = datos.length > 1 ? datos[1].timestamp - datos[0].timestamp : 86_400_000
    const points = copia.points.map((p) => ({
      ...p,
      ...(typeof p.timestamp === "number" ? { timestamp: p.timestamp + delta * 5 } : {}),
    }))
    chart.createOverlay({ ...copia, points, ...eventosOverlay })
    setEstado("Dibujo pegado — muévelo a su sitio y guarda")
  }

  // Teclado global: Supr borra, Ctrl/Cmd+C copia, Ctrl/Cmd+V pega. Se ignoran
  // pulsaciones con el foco en un input (los diálogos tienen los suyos).
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const objetivo = e.target as HTMLElement | null
      if (objetivo && (objetivo.tagName === "INPUT" || objetivo.tagName === "TEXTAREA")) return
      if ((e.key === "Delete" || e.key === "Backspace") && seleccionado) {
        e.preventDefault()
        borrarSeleccionado()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && seleccionado) {
        copiarSeleccionado()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        pegarDibujo()
      }
    }
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
  })

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

  // Ojo de la leyenda: oculta/muestra el indicador sin quitarlo. El estado
  // viaja con el resto (visible: false solo cuando está oculto) y se persiste
  // por símbolo al guardar, como colores o calcParams.
  const alternarVisibilidad = (name: string) => {
    const chart = chartRef.current
    const vivos = indicadoresRef.current ?? []
    const ind = vivos.find((i) => i.name === name)
    if (!chart || !ind) return
    const ocultar = ind.visible !== false
    chart.overrideIndicator({ name, visible: !ocultar })
    actualizarIndicadores(
      vivos.map((i) => {
        if (i.name !== name) return i
        const copia = { ...i }
        if (ocultar) copia.visible = false
        else delete copia.visible
        return copia
      }),
    )
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
      ...(overlay.styles ? { styles: overlay.styles } : {}),
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
        <div
          ref={contenedorRef}
          className={cn("h-full w-full", arrastrando && "[&_*]:!cursor-grabbing")}
          onMouseDown={(e) => e.button === 0 && setArrastrando(true)}
          onMouseUp={() => setArrastrando(false)}
          onMouseLeave={() => setArrastrando(false)}
        />
        {seleccionado && (
          <div className="absolute right-14 top-2 z-10 hidden gap-1 dibujo:flex">
            {/* La regla no se ajusta: su verde/rojo indica dirección, es semántico */}
            {seleccionado.name !== "measure" && (
              <Button size="sm" variant="secondary" className="border" onClick={abrirAjustesDibujo}>
                <Settings2 />
                Ajustes
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              title="También puedes pulsar Supr"
              className="border text-destructive hover:text-destructive"
              onClick={borrarSeleccionado}
            >
              <Trash2 />
              Borrar {etiquetaHerramienta(seleccionado.name)}
            </Button>
          </div>
        )}
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

      <AjustesDibujo
        abierto={ajustesDibujo !== null}
        titulo={seleccionado ? etiquetaHerramienta(seleccionado.name) : ""}
        ajustes={ajustesDibujo}
        onCerrar={() => setAjustesDibujo(null)}
        onCambiar={cambiarAjustesDibujo}
        onFijarBase={fijarBaseFibo}
      />
    </div>
  )
}
