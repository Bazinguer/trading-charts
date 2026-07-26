/**
 * Derivado del overlay incorporado fibonacciLine de KLineChart 10.0.0
 * (github.com/klinecharts/KLineChart, src/extension/overlay/fibonacciLine.ts).
 * Se registra con el MISMO nombre para sustituirlo: los dibujos guardados
 * ganan el nuevo comportamiento sin migración. Diferencias con el original:
 * líneas acotadas al ancho entre los dos puntos, presentación estilo
 * TradingView (diagonal punteada entre anclajes, banda rellena entre niveles
 * consecutivos y color por nivel) y configuración vía extendData
 * (niveles visibles y color único opcional).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { OverlayTemplate } from "klinecharts"

// Niveles estándar (fracción del rango). El 1 y el 0 son los extremos.
export const NIVELES_FIBONACCI = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0]

// niveles: CSV de fracciones ("1,0.618,0"). Es string a propósito: el
// overrideOverlay de KLineChart fusiona extendData en profundidad y los
// ARRAYS se mezclan por índice — al encoger, los niveles viejos del final
// sobrevivirían. Un string se asigna entero, nunca se fusiona.
// color: null/ausente = paleta por nivel (multicolor); string = monocromo.
export type ExtraFibonacci = { niveles?: string; color?: string | null }

export function nivelesDeExtra(extra: ExtraFibonacci | undefined): number[] {
  if (!extra?.niveles) return NIVELES_FIBONACCI
  const niveles = extra.niveles
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n))
  return niveles.length > 0 ? niveles : NIVELES_FIBONACCI
}

// Paleta por nivel estilo TradingView, dark-friendly (tokens del DS).
const COLOR_NIVEL: Record<string, string> = {
  "1": "#94A3B8",
  "0.786": "#38BDF8",
  "0.618": "#2DD4BF",
  "0.5": "#22C55E",
  "0.382": "#A3E635",
  "0.236": "#F59E0B",
  "0": "#94A3B8",
}

function colorDe(nivel: number, unico: string | null | undefined): string {
  return unico ?? COLOR_NIVEL[String(nivel)] ?? "#94A3B8"
}

function rgba(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
}

export const fibonacci: OverlayTemplate = {
  name: "fibonacciLine",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ chart, coordinates, overlay, yAxis }) => {
    const points = overlay.points
    if (coordinates.length < 2) return []
    if (typeof points[0].value !== "number" || typeof points[1].value !== "number") return []

    let precision = 0
    if (yAxis?.isInCandle() ?? true) {
      precision = chart.getSymbol()?.pricePrecision ?? 2
    } else {
      chart.getIndicators({ paneId: overlay.paneId }).forEach((indicador) => {
        precision = Math.max(precision, indicador.precision)
      })
    }

    const extra = overlay.extendData as ExtraFibonacci | undefined
    const visibles = nivelesDeExtra(extra).sort((a, b) => b - a)
    const colorUnico = extra?.color
    const linea = overlay.styles?.line as
      | { size?: number; style?: string; dashedValue?: number[] }
      | undefined

    const valorInicio = points[0].value
    const valorFin = points[1].value
    // Acotado al rango de los puntos, no al ancho completo del gráfico.
    const inicioX = Math.min(coordinates[0].x, coordinates[1].x)
    const finX = Math.max(coordinates[0].x, coordinates[1].x)
    const difY = coordinates[0].y - coordinates[1].y
    const difValor = valorInicio - valorFin
    const yDe = (nivel: number) => coordinates[1].y + difY * nivel

    // Bandas entre niveles consecutivos, teñidas por el nivel superior del par.
    const bandas = visibles.slice(0, -1).map((nivel, i) => ({
      type: "rect",
      isCheckEvent: false,
      attrs: {
        x: inicioX,
        y: Math.min(yDe(nivel), yDe(visibles[i + 1])),
        width: finX - inicioX,
        height: Math.abs(yDe(visibles[i + 1]) - yDe(nivel)),
      },
      styles: { style: "fill", color: rgba(colorDe(nivel, colorUnico), 0.08) },
    }))

    const lineas = visibles.map((nivel) => ({
      type: "line",
      attrs: {
        coordinates: [
          { x: inicioX, y: yDe(nivel) },
          { x: finX, y: yDe(nivel) },
        ],
      },
      styles: {
        color: colorDe(nivel, colorUnico),
        size: linea?.size ?? 1,
        style: linea?.style ?? "solid",
        dashedValue: linea?.dashedValue,
      },
    }))

    const textos = visibles.map((nivel) => {
      const precio = chart
        .getDecimalFold()
        .format(
          chart.getThousandsSeparator().format((valorFin + difValor * nivel).toFixed(precision)),
        )
      return {
        type: "text",
        isCheckEvent: false,
        attrs: { x: inicioX, y: yDe(nivel), text: `${nivel} (${precio})`, baseline: "bottom" },
        styles: { color: colorDe(nivel, colorUnico), backgroundColor: "transparent" },
      }
    })

    // Diagonal punteada entre los dos anclajes, como TradingView.
    const diagonal = {
      type: "line",
      attrs: { coordinates: [coordinates[0], coordinates[1]] },
      styles: { style: "dashed", dashedValue: [4, 4], size: 1, color: "rgba(148, 163, 184, 0.6)" },
    }

    return [...bandas, diagonal, ...lineas, ...textos]
  },
}
