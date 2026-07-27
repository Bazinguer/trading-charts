// Estilos de KLineChart dependientes del tema y de las preferencias de
// visualización. Colores alineados con docs/design/BRAND.md.

import type { Chart, DeepPartial, OverlayStyle, Styles } from "klinecharts"

import { RELLENO_FORMAS } from "@/lib/overlays"

export type Tema = "oscuro" | "claro"

// Ids de las features (👁/⚙/✕) de la leyenda de cada indicador; el click llega
// por la acción onIndicatorTooltipFeatureClick con este id.
export const FEATURE_OJO = "ojo-indicador"
export const FEATURE_AJUSTES = "ajustes-indicador"
export const FEATURE_QUITAR = "quitar-indicador"

const TOKENS = {
  oscuro: {
    texto: "#F1F5F9", // --foreground
    textoSuave: "#CBD5E1",
    icono: "#94A3B8", // --muted-foreground
    rejilla: "rgba(148, 163, 184, 0.10)",
  },
  claro: {
    texto: "#0F172A",
    textoSuave: "#334155",
    icono: "#64748B",
    rejilla: "rgba(15, 23, 42, 0.07)",
  },
}

// Paleta de swatches para las líneas de los indicadores ("Auto" = default).
export const PALETA_LINEAS = [
  "#F59E0B",
  "#38BDF8",
  "#A78BFA",
  "#EC4899",
  "#22C55E",
  "#EF4444",
  "#06B6D4",
  "#94A3B8",
]

// position "middle": tras el título (ancho FIJO), nunca tras los valores de la
// leyenda, que cambian de ancho con el crosshair y convertirían el icono en un
// blanco móvil imposible de clicar. Padding generoso = más zona de click.
function feature(id: string, code: string, tema: Tema) {
  return {
    id,
    position: "middle" as const,
    marginLeft: 6,
    paddingLeft: 3,
    paddingRight: 3,
    paddingTop: 3,
    paddingBottom: 3,
    size: 14,
    color: TOKENS[tema].icono,
    activeColor: TOKENS[tema].texto,
    type: "icon_font" as const,
    content: { family: "system-ui, sans-serif", code },
  }
}

// Ojo de mostrar/ocultar: path dibujado a medida en caja de 14×14 porque la
// librería pinta los paths a escala 1:1 (un SVG estándar de 24 no cabría).
// Solo comandos con coordenadas absolutas (M/Q/C/Z): el parser de la 10.0.0
// resetea el punto de partida en cada comando y rompe los arcos (A) y los
// relativos — la pupila es un círculo aproximado con cúbicas.
const PATH_OJO =
  "M1 7Q7 2.2 13 7Q7 11.8 1 7Z" +
  "M7 4.9C8.16 4.9 9.1 5.84 9.1 7C9.1 8.16 8.16 9.1 7 9.1C5.84 9.1 4.9 8.16 4.9 7C4.9 5.84 5.84 4.9 7 4.9Z"

function featureOjo(tema: Tema) {
  return {
    ...feature(FEATURE_OJO, "", tema),
    type: "path" as const,
    content: { path: PATH_OJO, style: "stroke" as const, lineWidth: 1.2 },
  }
}

export function estilosBase(tema: Tema, rejilla: boolean): DeepPartial<Styles> {
  const t = TOKENS[tema]
  return {
    grid: {
      show: rejilla,
      horizontal: { color: t.rejilla },
      vertical: { color: t.rejilla },
    },
    candle: {
      tooltip: {
        title: { color: t.texto },
        legend: { color: t.texto },
      },
    },
    indicator: {
      tooltip: {
        title: { color: t.textoSuave },
        legend: { color: t.textoSuave },
        features: [
          featureOjo(tema),
          feature(FEATURE_AJUSTES, "⚙", tema),
          feature(FEATURE_QUITAR, "✕", tema),
        ],
      },
    },
  }
}

export type EstiloLinea = "continua" | "discontinua" | "punteada"

// Estilo de línea de KLineChart a partir de los ajustes básicos de un dibujo.
export function lineaDesdeAjustes(grosor: number | undefined, estilo: EstiloLinea) {
  return {
    size: grosor ?? 1,
    style: estilo === "continua" ? ("solid" as const) : ("dashed" as const),
    dashedValue: estilo === "punteada" ? [2, 3] : [8, 5],
  }
}

function hexARgba(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
}

// Estilos de un dibujo (overlay) a partir de los ajustes básicos. Se escriben
// las familias de figuras a la vez (línea, polígono, círculo, texto) para que
// el mismo diálogo valga para cualquier herramienta; "Auto" materializa los
// defaults porque overrideOverlay fusiona y no sabría "des-poner" una clave.
export function estilosDibujo(
  chart: Chart,
  color: string | null,
  grosor: number | undefined,
  estilo: EstiloLinea,
): DeepPartial<OverlayStyle> {
  const base = chart.getStyles().overlay
  const colorFinal = color ?? base.line.color
  const size = grosor ?? base.line.size
  const style = estilo === "continua" ? ("solid" as const) : ("dashed" as const)
  const dashedValue =
    estilo === "punteada" ? [2, 3] : estilo === "discontinua" ? [8, 5] : base.line.dashedValue
  const borde = {
    borderColor: colorFinal,
    borderSize: size,
    borderStyle: style,
    borderDashedValue: dashedValue,
    color: color ? hexARgba(color, 0.15) : RELLENO_FORMAS,
  }
  return {
    line: { color: colorFinal, size, style, dashedValue },
    polygon: borde,
    circle: borde,
    text: { color: colorFinal },
  }
}

// Estilos de línea COMPLETOS para un indicador (n líneas): partimos de los
// defaults computados de la librería y pisamos color/grosor personalizados.
// Objetos completos porque el array de estilos reemplaza, no se fusiona.
export function estilosLineas(
  chart: Chart,
  colores: (string | null)[],
  grosor: number | undefined,
  numLineas: number,
): DeepPartial<Styles["indicator"]> {
  const base = chart.getStyles().indicator.lines
  const lines = Array.from({ length: numLineas }, (_, i) => ({
    ...base[i % base.length],
    ...(colores[i] ? { color: colores[i] as string } : {}),
    ...(grosor ? { size: grosor } : {}),
  }))
  return { lines }
}
