import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PALETA_LINEAS } from "@/lib/estilosGrafico"
import { etiquetaDe, type Indicador } from "@/lib/indicadores"
import { cn } from "@/lib/utils"

const GROSORES: { valor: number | undefined; etiqueta: string }[] = [
  { valor: undefined, etiqueta: "Auto" },
  { valor: 1, etiqueta: "1 px" },
  { valor: 2, etiqueta: "2 px" },
  { valor: 3, etiqueta: "3 px" },
]

// Ajustes básicos de un indicador: color por línea y grosor común. Los
// cambios se aplican al momento; "Auto" delega en el default de la librería.
export function AjustesIndicador({
  indicador,
  lineas,
  onCerrar,
  onCambiar,
}: {
  indicador: Indicador | null
  lineas: string[]
  onCerrar: () => void
  onCambiar: (name: string, colores: (string | null)[], grosor?: number) => void
}) {
  if (!indicador) return null

  const colores = lineas.map((_, i) => indicador.colores?.[i] ?? null)

  const elegirColor = (indice: number, color: string | null) => {
    const nuevos = [...colores]
    nuevos[indice] = color
    onCambiar(indicador.name, nuevos, indicador.grosor)
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{etiquetaDe(indicador.name)}</DialogTitle>
          <DialogDescription>
            Los cambios se aplican al momento y se guardan con el análisis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">Grosor</span>
          <div className="flex gap-1">
            {GROSORES.map((g) => (
              <Button
                key={g.etiqueta}
                size="sm"
                variant={indicador.grosor === g.valor ? "default" : "secondary"}
                className="h-7 px-2 text-xs"
                onClick={() => onCambiar(indicador.name, colores, g.valor)}
              >
                {g.etiqueta}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {lineas.map((linea, i) => (
            <div key={linea} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">{linea}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => elegirColor(i, null)}
                  className={cn(
                    "h-6 rounded-full border px-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
                    colores[i] === null && "border-ring text-foreground",
                  )}
                >
                  Auto
                </button>
                {PALETA_LINEAS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color} para ${linea}`}
                    onClick={() => elegirColor(i, color)}
                    className={cn(
                      "h-5 w-5 rounded-full border border-border transition-transform hover:scale-110",
                      colores[i] === color && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
