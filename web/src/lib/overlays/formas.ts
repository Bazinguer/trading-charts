/**
 * Adaptado de @klinecharts/pro (github.com/klinecharts/pro, rama refactor,
 * src/extension/{rect,circle,triangle}.ts) — mismo autor que KLineChart.
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

// Relleno al 15% del primary del DS (#38BDF8) en vez del azul de klinecharts.
export const RELLENO = "rgba(56, 189, 248, 0.15)"

function distancia(a: Coordinate, b: Coordinate): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export const rect: OverlayTemplate = {
  name: "rect",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: { polygon: { color: RELLENO } },
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      return [
        {
          type: "polygon",
          attrs: {
            coordinates: [
              coordinates[0],
              { x: coordinates[1].x, y: coordinates[0].y },
              coordinates[1],
              { x: coordinates[0].x, y: coordinates[1].y },
            ],
          },
          styles: { style: "stroke_fill" },
        },
      ]
    }
    return []
  },
}

export const circle: OverlayTemplate = {
  name: "circle",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: { circle: { color: RELLENO } },
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      return {
        type: "circle",
        attrs: { ...coordinates[0], r: distancia(coordinates[0], coordinates[1]) },
        styles: { style: "stroke_fill" },
      }
    }
    return []
  },
}

export const triangle: OverlayTemplate = {
  name: "triangle",
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: { polygon: { color: RELLENO } },
  createPointFigures: ({ coordinates }) => {
    return [
      {
        type: "polygon",
        attrs: { coordinates },
        styles: { style: "stroke_fill" },
      },
    ]
  },
}
