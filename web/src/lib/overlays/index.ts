// Overlays propios/adaptados. Sus NOMBRES (rect, circle, triangle, measure,
// fibonacciLine) forman parte del contrato de persistencia de dibujos.db:
// renombrarlos rompería dibujos guardados. fibonacciLine SUSTITUYE al
// incorporado (registro con el mismo nombre, deliberado).

import { registerOverlay } from "klinecharts"

import { fibonacci } from "./fibonacci"
import { circle, rect, triangle } from "./formas"
import { medicion } from "./medicion"

export { NIVELES_FIBONACCI, nivelesDeExtra, type ExtraFibonacci } from "./fibonacci"
export { RELLENO as RELLENO_FORMAS } from "./formas"

export function registrarOverlays(): void {
  ;[rect, circle, triangle, medicion, fibonacci].forEach(registerOverlay)
}
