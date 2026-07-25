/**
 * Adaptado de react-klinecharts-ui (github.com/NemeZZiZZ/react-klinecharts-ui,
 * src/overlays/measure.ts), licencia Apache-2.0.
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

// Colores success/destructive del DS (BRAND.md) en vez de los del original.
const SUBIDA = "#22C55E"
const BAJADA = "#EF4444"

function duracion(ms: number): string {
  const minutos = Math.floor(ms / 60_000)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)
  if (dias > 0) return `${dias}d ${horas % 24}h`
  if (horas > 0) return `${horas}h ${minutos % 60}m`
  return `${minutos}m`
}

// Índice de la vela con ese timestamp (búsqueda binaria; datos ordenados).
// Los puntos restaurados de BD no traen dataIndex, solo timestamp.
function indicePorTimestamp(datos: { timestamp: number }[], objetivo: number): number {
  let inicio = 0
  let fin = datos.length - 1
  while (inicio < fin) {
    const medio = (inicio + fin) >> 1
    if (datos[medio].timestamp < objetivo) inicio = medio + 1
    else fin = medio
  }
  return inicio
}

// Regla de medición: entre dos puntos muestra diferencia de precio, % de
// cambio, nº de velas y duración, con caja verde/roja según la dirección.
export const medicion: OverlayTemplate = {
  name: "measure",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ chart, overlay, coordinates }) => {
    if (coordinates.length < 2) return []

    const [inicio, fin] = overlay.points
    const [coordInicio, coordFin] = coordinates
    const valorInicio = inicio.value ?? 0
    const valorFin = fin.value ?? 0
    const diferencia = valorFin - valorInicio
    const porcentaje = valorInicio !== 0 ? ((diferencia / valorInicio) * 100).toFixed(2) : "0.00"
    const datos = chart.getDataList()
    const indiceDe = (p: { dataIndex?: number; timestamp?: number }) =>
      p.dataIndex ?? indicePorTimestamp(datos, p.timestamp ?? 0)
    const velas = Math.abs(indiceDe(fin) - indiceDe(inicio))
    const tiempo = duracion(Math.abs((fin.timestamp ?? 0) - (inicio.timestamp ?? 0)))

    const sube = diferencia >= 0
    const color = sube ? SUBIDA : BAJADA

    const lineas = [
      `${sube ? "▲" : "▼"} ${diferencia.toFixed(2)} (${porcentaje}%)`,
      `${velas} velas · ${tiempo}`,
    ]

    return [
      {
        type: "rect",
        attrs: {
          x: Math.min(coordInicio.x, coordFin.x),
          y: Math.min(coordInicio.y, coordFin.y),
          width: Math.abs(coordInicio.x - coordFin.x),
          height: Math.abs(coordInicio.y - coordFin.y),
        },
        styles: { style: "fill", color: sube ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)" },
      },
      {
        type: "line",
        attrs: { coordinates: [coordInicio, coordFin] },
        styles: { color, style: "dashed" },
      },
      ...lineas.map((texto, i) => ({
        type: "text",
        attrs: {
          x: coordFin.x,
          y: coordFin.y + (sube ? -40 : 20) + i * 16,
          text: texto,
          align: "center" as const,
          baseline: "middle" as const,
        },
        styles: {
          color: "#FFFFFF",
          backgroundColor: color,
          paddingLeft: 4,
          paddingRight: 4,
          paddingTop: 2,
          paddingBottom: 2,
          borderRadius: 2,
        },
      })),
    ]
  },
}
