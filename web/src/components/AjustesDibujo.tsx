import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PALETA_LINEAS } from "@/lib/estilosGrafico"
import { NIVELES_FIBONACCI } from "@/lib/overlays"
import { cn } from "@/lib/utils"

const GROSORES: { valor: number | undefined; etiqueta: string }[] = [
  { valor: undefined, etiqueta: "Auto" },
  { valor: 1, etiqueta: "1 px" },
  { valor: 2, etiqueta: "2 px" },
  { valor: 3, etiqueta: "3 px" },
]

const etiquetaNivel = (nivel: number) => `${parseFloat((nivel * 100).toFixed(1))}%`

export type AjustesFibonacci = { niveles: number[]; color: string | null; grosor?: number }

// Ajustes del dibujo de Fibonacci seleccionado: niveles visibles, color y
// grosor. Los cambios se aplican al momento y se guardan con el análisis.
export function AjustesDibujo({
  abierto,
  ajustes,
  onCerrar,
  onCambiar,
}: {
  abierto: boolean
  ajustes: AjustesFibonacci | null
  onCerrar: () => void
  onCambiar: (cambios: AjustesFibonacci) => void
}) {
  if (!abierto || !ajustes) return null

  const alternarNivel = (nivel: number) => {
    const visibles = ajustes.niveles.includes(nivel)
      ? ajustes.niveles.filter((n) => n !== nivel)
      : NIVELES_FIBONACCI.filter((n) => n === nivel || ajustes.niveles.includes(n))
    if (visibles.length === 0) return
    onCambiar({ ...ajustes, niveles: visibles })
  }

  return (
    <Dialog open onOpenChange={(sigue) => !sigue && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Fibonacci</DialogTitle>
          <DialogDescription>
            Los cambios se aplican al momento y se guardan con el análisis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2">
          <span className="w-24 shrink-0 pt-1 text-sm text-muted-foreground">Niveles</span>
          <div className="flex flex-wrap gap-1">
            {NIVELES_FIBONACCI.map((nivel) => (
              <Button
                key={nivel}
                size="sm"
                variant={ajustes.niveles.includes(nivel) ? "default" : "secondary"}
                className="h-7 px-2 text-xs tabular-nums"
                onClick={() => alternarNivel(nivel)}
              >
                {etiquetaNivel(nivel)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">Color</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCambiar({ ...ajustes, color: null })}
              className={cn(
                "h-6 rounded-full border px-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
                ajustes.color === null && "border-ring text-foreground",
              )}
            >
              Auto
            </button>
            {PALETA_LINEAS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                onClick={() => onCambiar({ ...ajustes, color })}
                className={cn(
                  "h-5 w-5 rounded-full border border-border transition-transform hover:scale-110",
                  ajustes.color === color && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">Grosor</span>
          <div className="flex gap-1">
            {GROSORES.map((g) => (
              <Button
                key={g.etiqueta}
                size="sm"
                variant={ajustes.grosor === g.valor ? "default" : "secondary"}
                className="h-7 px-2 text-xs"
                onClick={() => onCambiar({ ...ajustes, grosor: g.valor })}
              >
                {g.etiqueta}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
