import { useState } from "react"
import type { ComponentType, SVGProps } from "react"
import {
  ArrowRight,
  ArrowUp,
  Circle,
  DollarSign,
  Equal,
  Eraser,
  Infinity,
  Minus,
  MoveHorizontal,
  MoveUpRight,
  MoveVertical,
  Save,
  SeparatorVertical,
  Slash,
  Square,
  Tag,
  Triangle,
  Type,
} from "lucide-react"

import {
  IconoCanal,
  IconoFibonacci,
  IconoFormas,
  IconoHorizontal,
  IconoLinea,
  IconoPincel,
  IconoRegla,
  IconoTexto,
  IconoVertical,
} from "@/components/IconosHerramientas"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Icono = ComponentType<SVGProps<SVGSVGElement>>
type Herramienta = { name: string; etiqueta: string; Icono: Icono }
type Grupo = { id: string; etiqueta: string; Icono: Icono; herramientas: Herramienta[] }

// Los 16 overlays incorporados de KLineChart 10, agrupados en "kits" estilo
// Investing. Un grupo de una sola herramienta se pinta como botón directo.
const GRUPOS: Grupo[] = [
  {
    id: "lineas",
    etiqueta: "Líneas",
    Icono: IconoLinea,
    herramientas: [
      { name: "segment", etiqueta: "Tendencia", Icono: Slash },
      { name: "rayLine", etiqueta: "Rayo", Icono: MoveUpRight },
      { name: "straightLine", etiqueta: "Recta infinita", Icono: Infinity },
    ],
  },
  {
    id: "horizontales",
    etiqueta: "Horizontales",
    Icono: IconoHorizontal,
    herramientas: [
      { name: "horizontalSegment", etiqueta: "Segmento horizontal", Icono: Minus },
      { name: "horizontalRayLine", etiqueta: "Rayo horizontal", Icono: ArrowRight },
      { name: "horizontalStraightLine", etiqueta: "Horizontal infinita", Icono: MoveHorizontal },
      { name: "priceLine", etiqueta: "Línea de precio", Icono: DollarSign },
    ],
  },
  {
    id: "verticales",
    etiqueta: "Verticales",
    Icono: IconoVertical,
    herramientas: [
      { name: "verticalSegment", etiqueta: "Segmento vertical", Icono: MoveVertical },
      { name: "verticalRayLine", etiqueta: "Rayo vertical", Icono: ArrowUp },
      { name: "verticalStraightLine", etiqueta: "Vertical infinita", Icono: SeparatorVertical },
    ],
  },
  {
    id: "canales",
    etiqueta: "Canales",
    Icono: IconoCanal,
    herramientas: [
      { name: "parallelStraightLine", etiqueta: "Paralelas", Icono: Equal },
      { name: "priceChannelLine", etiqueta: "Canal de precio", Icono: MoveUpRight },
    ],
  },
  {
    id: "fibonacci",
    etiqueta: "Fibonacci",
    Icono: IconoFibonacci,
    herramientas: [{ name: "fibonacciLine", etiqueta: "Fibonacci", Icono: IconoFibonacci }],
  },
  {
    id: "formas",
    etiqueta: "Formas",
    Icono: IconoFormas,
    herramientas: [
      { name: "rect", etiqueta: "Rectángulo", Icono: Square },
      { name: "circle", etiqueta: "Círculo", Icono: Circle },
      { name: "triangle", etiqueta: "Triángulo", Icono: Triangle },
    ],
  },
  {
    id: "medicion",
    etiqueta: "Regla",
    Icono: IconoRegla,
    herramientas: [{ name: "measure", etiqueta: "Regla de medición", Icono: IconoRegla }],
  },
  {
    id: "anotaciones",
    etiqueta: "Anotaciones",
    Icono: IconoTexto,
    herramientas: [
      { name: "simpleAnnotation", etiqueta: "Texto", Icono: Type },
      { name: "simpleTag", etiqueta: "Etiqueta", Icono: Tag },
    ],
  },
  {
    id: "pincel",
    etiqueta: "Pincel",
    Icono: IconoPincel,
    herramientas: [{ name: "brush", etiqueta: "Pincel", Icono: IconoPincel }],
  },
]

// Etiqueta en español de una herramienta por su nombre de overlay.
export function etiquetaHerramienta(name: string): string {
  for (const grupo of GRUPOS) {
    const herramienta = grupo.herramientas.find((h) => h.name === name)
    if (herramienta) return herramienta.etiqueta
  }
  return name
}

export function BarraHerramientas({
  onDibujar,
  onGuardar,
  onLimpiar,
}: {
  onDibujar: (name: string) => void
  onGuardar: () => void
  onLimpiar: () => void
}) {
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null)

  const elegir = (name: string) => {
    setGrupoAbierto(null)
    onDibujar(name)
  }

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 rounded-[10px] border bg-card p-1">
      {GRUPOS.map((grupo) =>
        grupo.herramientas.length === 1 ? (
          <Button
            key={grupo.id}
            variant="ghost"
            size="icon-sm"
            title={grupo.herramientas[0].etiqueta}
            aria-label={grupo.herramientas[0].etiqueta}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => elegir(grupo.herramientas[0].name)}
          >
            <grupo.Icono className="size-5" />
          </Button>
        ) : (
          <Popover
            key={grupo.id}
            open={grupoAbierto === grupo.id}
            onOpenChange={(abierto) => setGrupoAbierto(abierto ? grupo.id : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title={grupo.etiqueta}
                aria-label={grupo.etiqueta}
                className="text-muted-foreground hover:text-foreground"
              >
                <grupo.Icono className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-1">
              {grupo.herramientas.map((h) => (
                <Button
                  key={h.name}
                  variant="ghost"
                  className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
                  onClick={() => elegir(h.name)}
                >
                  <h.Icono className="h-4 w-4 text-muted-foreground" />
                  {h.etiqueta}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        ),
      )}

      <div className="my-1 h-px w-6 shrink-0 bg-border" />
      <Button
        variant="ghost"
        size="icon-sm"
        title="Guardar análisis"
        aria-label="Guardar análisis"
        className="text-primary hover:text-primary"
        onClick={onGuardar}
      >
        <Save className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Limpiar dibujos (sin guardar)"
        aria-label="Limpiar dibujos"
        className="text-muted-foreground hover:text-destructive"
        onClick={onLimpiar}
      >
        <Eraser className="size-5" />
      </Button>
    </div>
  )
}
