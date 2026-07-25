import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CATALOGO, etiquetaDe, type EntradaCatalogo, type Indicador } from "@/lib/indicadores"

export function SelectorIndicadores({
  abierto,
  onAbierto,
  activos,
  onAnadir,
  onQuitar,
  onParams,
}: {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  activos: Indicador[]
  onAnadir: (entrada: EntradaCatalogo) => void
  onQuitar: (name: string) => void
  onParams: (name: string, calcParams: number[]) => void
}) {
  const nombresActivos = new Set(activos.map((a) => a.name))
  const disponibles = CATALOGO.filter((e) => !nombresActivos.has(e.name))
  const precio = disponibles.filter((e) => !e.panel)
  const paneles = disponibles.filter((e) => e.panel)

  return (
    <Dialog open={abierto} onOpenChange={onAbierto}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">Indicadores</DialogTitle>
          <DialogDescription>
            Se guardan con el análisis del símbolo, junto a los dibujos.
          </DialogDescription>
        </DialogHeader>

        {activos.length > 0 && (
          <div className="flex flex-col gap-1 border-b px-4 py-3">
            {activos.map((a) => (
              <FilaActivo key={a.name} activo={a} onQuitar={onQuitar} onParams={onParams} />
            ))}
          </div>
        )}

        <Command>
          <CommandInput placeholder="Buscar indicador…" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {precio.length > 0 && (
              <CommandGroup heading="Sobre el precio">
                {precio.map((e) => (
                  <ItemCatalogo key={e.name} entrada={e} onAnadir={onAnadir} />
                ))}
              </CommandGroup>
            )}
            {paneles.length > 0 && (
              <CommandGroup heading="En panel aparte">
                {paneles.map((e) => (
                  <ItemCatalogo key={e.name} entrada={e} onAnadir={onAnadir} />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function ItemCatalogo({
  entrada,
  onAnadir,
}: {
  entrada: EntradaCatalogo
  onAnadir: (entrada: EntradaCatalogo) => void
}) {
  return (
    <CommandItem value={`${entrada.name} ${entrada.etiqueta}`} onSelect={() => onAnadir(entrada)}>
      <span className="flex-1">{entrada.etiqueta}</span>
      <span className="text-xs text-muted-foreground">{entrada.name}</span>
    </CommandItem>
  )
}

function FilaActivo({
  activo,
  onQuitar,
  onParams,
}: {
  activo: Indicador
  onQuitar: (name: string) => void
  onParams: (name: string, calcParams: number[]) => void
}) {
  const [texto, setTexto] = useState(activo.calcParams.join(", "))

  // Entrada libre "5, 10, 30": solo se aplica si queda algún número válido.
  const confirmar = () => {
    const numeros = texto
      .split(",")
      .map((t) => Number(t.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (numeros.length > 0) onParams(activo.name, numeros)
    else setTexto(activo.calcParams.join(", "))
  }

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm">{etiquetaDe(activo.name)}</span>
      {activo.calcParams.length > 0 && (
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          aria-label={`Parámetros de ${etiquetaDe(activo.name)}`}
          className="h-8 w-32 text-xs tabular-nums"
        />
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        title="Quitar"
        aria-label={`Quitar ${etiquetaDe(activo.name)}`}
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onQuitar(activo.name)}
      >
        <X />
      </Button>
    </div>
  )
}
