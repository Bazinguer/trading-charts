/**
 * Derivado del overlay incorporado fibonacciLine de KLineChart 10.0.0
 * (github.com/klinecharts/KLineChart, src/extension/overlay/fibonacciLine.ts).
 * Se registra con el MISMO nombre para sustituirlo: los dibujos guardados
 * ganan el nuevo comportamiento sin migración. Diferencias con el original:
 * las líneas se acotan al ancho entre los dos puntos (no al gráfico entero)
 * y los niveles visibles se leen de extendData.niveles.
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

import type { Coordinate, OverlayTemplate } from "klinecharts"

// Niveles estándar (fracción del rango). El 1 y el 0 son los extremos.
export const NIVELES_FIBONACCI = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0]

export type ExtraFibonacci = { niveles?: number[] }

export const fibonacci: OverlayTemplate = {
  name: "fibonacciLine",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ chart, coordinates, overlay, yAxis }) => {
    const points = overlay.points
    if (coordinates.length === 0) return []

    let precision = 0
    if (yAxis?.isInCandle() ?? true) {
      precision = chart.getSymbol()?.pricePrecision ?? 2
    } else {
      chart.getIndicators({ paneId: overlay.paneId }).forEach((indicador) => {
        precision = Math.max(precision, indicador.precision)
      })
    }

    const lineas: { coordinates: Coordinate[] }[] = []
    const textos: { x: number; y: number; text: string; baseline: string }[] = []
    if (
      coordinates.length > 1 &&
      typeof points[0].value === "number" &&
      typeof points[1].value === "number"
    ) {
      const valorInicio = points[0].value
      const valorFin = points[1].value
      const niveles = (overlay.extendData as ExtraFibonacci | undefined)?.niveles ?? NIVELES_FIBONACCI
      // Acotado al rango de los puntos, no al ancho completo del gráfico.
      const inicioX = Math.min(coordinates[0].x, coordinates[1].x)
      const finX = Math.max(coordinates[0].x, coordinates[1].x)
      const difY = coordinates[0].y - coordinates[1].y
      const difValor = valorInicio - valorFin
      niveles.forEach((nivel) => {
        const y = coordinates[1].y + difY * nivel
        const valor = chart
          .getDecimalFold()
          .format(chart.getThousandsSeparator().format((valorFin + difValor * nivel).toFixed(precision)))
        lineas.push({
          coordinates: [
            { x: inicioX, y },
            { x: finX, y },
          ],
        })
        textos.push({ x: inicioX, y, text: `${valor} (${(nivel * 100).toFixed(1)}%)`, baseline: "bottom" })
      })
    }

    return [
      { type: "line", attrs: lineas },
      { type: "text", isCheckEvent: false, attrs: textos },
    ]
  },
}
