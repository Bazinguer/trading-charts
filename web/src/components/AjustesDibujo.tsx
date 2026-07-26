import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PALETA_LINEAS, type EstiloLinea } from "@/lib/estilosGrafico"
import { NIVELES_FIBONACCI } from "@/lib/overlays"
import { cn } from "@/lib/utils"

const GROSORES: { valor: number | undefined; etiqueta: string }[] = [
  { valor: undefined, etiqueta: "Auto" },
  { valor: 1, etiqueta: "1 px" },
  { valor: 2, etiqueta: "2 px" },
  { valor: 3, etiqueta: "3 px" },
]

const ESTILOS: { valor: EstiloLinea; etiqueta: string; muestra: string }[] = [
  { valor: "continua", etiqueta: "Continua", muestra: "───────" },
  { valor: "discontinua", etiqueta: "Discontinua", muestra: "── ── ──" },
  { valor: "punteada", etiqueta: "Punteada", muestra: "‥‥‥‥‥" },
]

const etiquetaNivel = (nivel: number) => `${parseFloat((nivel * 100).toFixed(1))}%`

export type AjustesForma = {
  niveles?: number[] // solo Fibonacci
  color: string | null
  grosor?: number
  estilo: EstiloLinea
}

// Ajustes básicos del dibujo seleccionado: color, grosor y estilo de línea;
// el Fibonacci añade sus niveles visibles. Cambios en vivo, guardados con el
// análisis.
export function AjustesDibujo({
  abierto,
  titulo,
  ajustes,
  onCerrar,
  onCambiar,
  onFijarBase,
}: {
  abierto: boolean
  titulo: string
  ajustes: AjustesForma | null
  onCerrar: () => void
  onCambiar: (cambios: AjustesForma) => void
  onFijarBase?: () => void
}) {
  if (!abierto || !ajustes) return null

  const alternarNivel = (nivel: number) => {
    if (!ajustes.niveles) return
    const visibles = ajustes.niveles.includes(nivel)
      ? ajustes.niveles.filter((n) => n !== nivel)
      : NIVELES_FIBONACCI.filter((n) => n === nivel || ajustes.niveles?.includes(n))
    if (visibles.length === 0) return
    onCambiar({ ...ajustes, niveles: visibles })
  }

  return (
    <Dialog open onOpenChange={(sigue) => !sigue && onCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{titulo}</DialogTitle>
          <DialogDescription>
            Los cambios se aplican al momento y se guardan con el análisis.
          </DialogDescription>
        </DialogHeader>

        {ajustes.niveles && (
          <div className="flex items-start gap-2">
            <span className="w-24 shrink-0 pt-1 text-sm text-muted-foreground">Niveles</span>
            <div className="flex flex-wrap gap-1">
              {NIVELES_FIBONACCI.map((nivel) => (
                <Button
                  key={nivel}
                  size="sm"
                  variant={ajustes.niveles?.includes(nivel) ? "default" : "secondary"}
                  className="h-7 px-2 text-xs tabular-nums"
                  onClick={() => alternarNivel(nivel)}
                >
                  {etiquetaNivel(nivel)}
                </Button>
              ))}
            </div>
          </div>
        )}

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

        <div className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">Estilo</span>
          <div className="flex gap-1">
            {ESTILOS.map((e) => (
              <Button
                key={e.valor}
                size="sm"
                variant={ajustes.estilo === e.valor ? "default" : "secondary"}
                title={e.etiqueta}
                aria-label={e.etiqueta}
                className="h-7 px-2 font-mono text-xs"
                onClick={() => onCambiar({ ...ajustes, estilo: e.valor })}
              >
                {e.muestra}
              </Button>
            ))}
          </div>
        </div>

        {ajustes.niveles && onFijarBase && (
          <div className="flex justify-end border-t pt-3">
            <Button size="sm" variant="secondary" onClick={onFijarBase}>
              Fijar como diseño base
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
