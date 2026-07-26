/**
 * Vendorizados de KLineChart 10.0.0 (src/extension/overlay/simpleAnnotation.ts
 * y simpleTag.ts) — mismos nombres que los incorporados: los SUSTITUYEN.
 *
 * Diferencia deliberada con el original: las figuras NO llevan ignoreEvent y
 * se activan las figuras por defecto (punto de anclaje + etiquetas de eje al
 * seleccionar). Sin ello el click atraviesa el dibujo: ni selección (botones
 * de ajustes/borrar), ni arrastre — a diferencia del resto de herramientas.
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

import { utils, type Overlay, type OverlayTemplate } from "klinecharts"

const PRECISION_PRECIO_DEFAULT = 2

function textoDe(overlay: Overlay): string {
  if (!utils.isValid(overlay.extendData)) return ""
  return utils.isFunction(overlay.extendData)
    ? String(overlay.extendData(overlay) ?? "")
    : String(overlay.extendData ?? "")
}

// "Texto": anotación anclada a una vela (flecha + texto encima).
export const anotacion: OverlayTemplate = {
  name: "simpleAnnotation",
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: { line: { style: "dashed" } },
  createPointFigures: ({ overlay, coordinates }) => {
    const startX = coordinates[0].x
    const startY = coordinates[0].y - 6
    const lineEndY = startY - 50
    const arrowEndY = lineEndY - 5
    return [
      {
        type: "line",
        attrs: {
          coordinates: [
            { x: startX, y: startY },
            { x: startX, y: lineEndY },
          ],
        },
      },
      {
        type: "polygon",
        attrs: {
          coordinates: [
            { x: startX, y: lineEndY },
            { x: startX - 4, y: arrowEndY },
            { x: startX + 4, y: arrowEndY },
          ],
        },
      },
      {
        type: "text",
        attrs: { x: startX, y: arrowEndY, text: textoDe(overlay), align: "center", baseline: "bottom" },
      },
    ]
  },
}

// "Etiqueta": línea horizontal a un precio con su texto en el eje Y.
// Sin needDefaultYAxisFigure: el texto del eje ya lo pinta createYAxisFigures
// (el default duplicaría la etiqueta con el precio encima).
export const etiqueta: OverlayTemplate = {
  name: "simpleTag",
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  styles: { line: { style: "dashed" } },
  createPointFigures: ({ bounding, coordinates }) => ({
    type: "line",
    attrs: {
      coordinates: [
        { x: 0, y: coordinates[0].y },
        { x: bounding.width, y: coordinates[0].y },
      ],
    },
  }),
  createYAxisFigures: ({ chart, overlay, coordinates, bounding, yAxis }) => {
    const desdeCero = yAxis?.isFromZero() ?? false
    let texto = textoDe(overlay)
    if (texto === "" && utils.isNumber(overlay.points[0].value)) {
      texto = utils.formatPrecision(
        overlay.points[0].value,
        chart.getSymbol()?.pricePrecision ?? PRECISION_PRECIO_DEFAULT,
      )
    }
    return {
      type: "text",
      attrs: {
        x: desdeCero ? 0 : bounding.width,
        y: coordinates[0].y,
        text: texto,
        align: desdeCero ? "left" : "right",
        baseline: "middle",
      },
    }
  },
}
