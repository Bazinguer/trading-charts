// Catálogo curado de los indicadores incorporados de KLineChart 10 (congelada).
// `panel` decide dónde vive: false = superpuesto al precio (candle_pane),
// true = en un panel propio debajo. Los calcParams por defecto los pone la
// librería al crear; solo persistimos los vigentes al guardar el análisis.

// Lo que se persiste por símbolo en dibujos.db, junto a los dibujos.
// colores/grosor son ajustes opcionales de las líneas ("Auto" = null/ausente,
// manda el default de la librería). visible solo se guarda cuando es false
// (oculto con el ojo de la leyenda); ausente = visible.
export type Indicador = {
  name: string
  calcParams: number[]
  panel: boolean
  colores?: (string | null)[]
  grosor?: number
  visible?: boolean
}

export type EntradaCatalogo = {
  name: string
  etiqueta: string
  panel: boolean
}

export const CATALOGO: EntradaCatalogo[] = [
  // Sobre el precio
  { name: "MA", etiqueta: "Medias móviles", panel: false },
  { name: "EMA", etiqueta: "Medias móviles exponenciales", panel: false },
  { name: "SMA", etiqueta: "Media móvil suavizada", panel: false },
  { name: "BOLL", etiqueta: "Bandas de Bollinger", panel: false },
  { name: "SAR", etiqueta: "SAR parabólico", panel: false },
  { name: "BBI", etiqueta: "BBI (índice alcista/bajista)", panel: false },
  // En panel aparte
  { name: "VOL", etiqueta: "Volumen", panel: true },
  { name: "MACD", etiqueta: "MACD", panel: true },
  { name: "RSI", etiqueta: "RSI (fuerza relativa)", panel: true },
  { name: "KDJ", etiqueta: "Estocástico (KDJ)", panel: true },
  { name: "CCI", etiqueta: "CCI (índice de canal)", panel: true },
  { name: "WR", etiqueta: "Williams %R", panel: true },
  { name: "DMI", etiqueta: "DMI (movimiento direccional)", panel: true },
  { name: "TRIX", etiqueta: "TRIX", panel: true },
  { name: "OBV", etiqueta: "OBV (volumen en balance)", panel: true },
  { name: "ROC", etiqueta: "ROC (tasa de cambio)", panel: true },
  { name: "MTM", etiqueta: "Momentum (MTM)", panel: true },
  { name: "AO", etiqueta: "Oscilador Awesome (AO)", panel: true },
  { name: "PSY", etiqueta: "Línea psicológica (PSY)", panel: true },
]

export function etiquetaDe(name: string): string {
  return CATALOGO.find((e) => e.name === name)?.etiqueta ?? name
}
