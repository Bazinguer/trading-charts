// Estilos de KLineChart dependientes del tema y de las preferencias de
// visualización. Colores alineados con docs/design/BRAND.md.

import type { Chart, DeepPartial, Styles } from "klinecharts"

export type Tema = "oscuro" | "claro"

// Ids de las features (⚙/✕) de la leyenda de cada indicador; el click llega
// por la acción onIndicatorTooltipFeatureClick con este id.
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
        features: [feature(FEATURE_AJUSTES, "⚙", tema), feature(FEATURE_QUITAR, "✕", tema)],
      },
    },
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
