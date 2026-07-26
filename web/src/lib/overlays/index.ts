// Overlays propios/adaptados. Sus NOMBRES (rect, circle, triangle, measure,
// fibonacciLine, simpleAnnotation, simpleTag) forman parte del contrato de
// persistencia de dibujos.db: renombrarlos rompería dibujos guardados.
// fibonacciLine, simpleAnnotation y simpleTag SUSTITUYEN a los incorporados
// (registro con el mismo nombre, deliberado).

import { registerOverlay } from "klinecharts"

import { fibonacci } from "./fibonacci"
import { circle, rect, triangle } from "./formas"
import { medicion } from "./medicion"
import { anotacion, etiqueta } from "./texto"

export { NIVELES_FIBONACCI, nivelesDeExtra, type ExtraFibonacci } from "./fibonacci"
export { RELLENO as RELLENO_FORMAS } from "./formas"

export function registrarOverlays(): void {
  ;[rect, circle, triangle, medicion, fibonacci, anotacion, etiqueta].forEach(registerOverlay)
}
