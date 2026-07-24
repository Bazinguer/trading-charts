import { useEffect, useRef, useState } from "react"
import { dispose, init } from "klinecharts"
import type { Chart } from "klinecharts"

import { api, apiPut, ErrorApi } from "@/lib/api"

// Overlays incorporados de KLineChart que exponemos en la barra de dibujo.
const HERRAMIENTAS = [
  { name: "segment", etiqueta: "Línea" },
  { name: "horizontalStraightLine", etiqueta: "Horizontal" },
  { name: "rect", etiqueta: "Rectángulo" },
  { name: "fibonacciLine", etiqueta: "Fibonacci" },
  { name: "simpleAnnotation", etiqueta: "Texto" },
]

type Velas = { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[]

// Del overlay vivo solo persistimos lo que hace falta para reconstruirlo:
// tipo + puntos anclados a tiempo/precio (+ texto de las anotaciones).
type DibujoGuardado = {
  name: string
  points: { timestamp?: number; value?: number }[]
  extendData?: unknown
}

export function GraficoVelas({ simbolo, intervalo }: { simbolo: string; intervalo: "1d" | "1w" }) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [estado, setEstado] = useState("")

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    let cancelado = false

    const arrancar = async () => {
      let velas: Velas
      try {
        velas = await api<Velas>(`/api/velas/${simbolo}?intervalo=${intervalo}`)
      } catch (e) {
        setEstado(`Error cargando velas: ${e instanceof ErrorApi ? e.message : "sin conexión"}`)
        return
      }
      if (cancelado) return

      const chart = init(contenedor)
      if (!chart) return
      chartRef.current = chart
      chart.setSymbol({ ticker: simbolo })
      chart.setPeriod({ span: intervalo === "1w" ? 7 : 1, type: "day" })
      // Servimos todo el histórico de una vez: la primera llamada recibe la
      // serie completa y las siguientes (scroll hacia atrás) nada.
      let servido = false
      chart.setDataLoader({
        getBars: ({ callback }) => {
          callback(servido ? [] : velas)
          servido = true
        },
      })

      const { overlays } = await api<{ overlays: DibujoGuardado[] }>(`/api/dibujos/${simbolo}`)
      if (!cancelado && overlays.length > 0) {
        chart.createOverlay(overlays)
        setEstado(`${overlays.length} dibujos restaurados`)
      }
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

  const guardar = async () => {
    const chart = chartRef.current
    if (!chart) return
    const overlays: DibujoGuardado[] = chart.getOverlays().map((overlay) => ({
      name: overlay.name,
      points: overlay.points.map((p) => ({ timestamp: p.timestamp, value: p.value })),
      extendData: overlay.extendData,
    }))
    try {
      await apiPut(`/api/dibujos/${simbolo}`, { overlays })
      setEstado(`${overlays.length} dibujos guardados`)
    } catch {
      setEstado("Error al guardar")
    }
  }

  const limpiar = () => {
    chartRef.current?.removeOverlay()
    setEstado("Dibujos borrados del gráfico (sin guardar)")
  }

  return (
    <div className="grafico">
      <div className="barra">
        {HERRAMIENTAS.map((h) => (
          <button key={h.name} onClick={() => dibujar(h.name)}>
            {h.etiqueta}
          </button>
        ))}
        <span className="separador" />
        <button className="primario" onClick={guardar}>
          Guardar
        </button>
        <button onClick={limpiar}>Limpiar</button>
        <span className="estado">{estado}</span>
      </div>
      <div ref={contenedorRef} className="lienzo" />
    </div>
  )
}
