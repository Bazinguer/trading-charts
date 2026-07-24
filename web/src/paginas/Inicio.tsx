import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, apiDelete, apiPost, apiPut, type Lista, type ResumenSimbolo } from "@/lib/api"
import { claseSigno, porcentaje, precio } from "@/lib/formato"
import { cn } from "@/lib/utils"

function TablaLista({
  lista,
  resumen,
  alGuardarSimbolos,
}: {
  lista: Lista
  resumen: Record<string, ResumenSimbolo>
  alGuardarSimbolos: (simbolos: string[]) => void
}) {
  const navegar = useNavigate()
  const [nuevo, setNuevo] = useState("")
  const simbolos = [...lista.simbolos].sort((a, b) => a.orden - b.orden).map((s) => s.simbolo)

  const anadir = (e: React.FormEvent) => {
    e.preventDefault()
    const simbolo = nuevo.trim().toUpperCase()
    if (!simbolo || simbolos.includes(simbolo)) return
    alGuardarSimbolos([...simbolos, simbolo])
    setNuevo("")
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border bg-card p-3">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Símbolo</TableHead>
            <TableHead className="text-right">Último</TableHead>
            <TableHead className="text-right">% var.</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {simbolos.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                Lista vacía: añade un símbolo abajo
              </TableCell>
            </TableRow>
          )}
          {simbolos.map((simbolo) => {
            const r = resumen[simbolo]
            return (
              <TableRow
                key={simbolo}
                className="cursor-pointer"
                onClick={() => navegar(`/grafico/${simbolo}`)}
              >
                <TableCell className="font-medium">{simbolo}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r?.ultimo != null ? precio(r.ultimo) : "—"}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", claseSigno(r?.var_pct))}>
                  {r?.var_pct != null ? porcentaje(r.var_pct) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Quitar ${simbolo}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      alGuardarSimbolos(simbolos.filter((s) => s !== simbolo))
                    }}
                  >
                    <X />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <form onSubmit={anadir} className="flex items-center gap-2 border-t pt-3">
        <Input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Añadir símbolo (p. ej. SOLUSDT)"
          className="h-8 w-56 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          <Plus /> Añadir
        </Button>
      </form>
    </div>
  )
}

export function Inicio() {
  const [listas, setListas] = useState<Lista[] | null>(null)
  const [resumen, setResumen] = useState<Record<string, ResumenSimbolo>>({})
  const [tab, setTab] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [renombrar, setRenombrar] = useState<Lista | null>(null)
  const [nombreEditado, setNombreEditado] = useState("")

  const cargar = useCallback(async (): Promise<Lista[] | undefined> => {
    try {
      const ls = await api<Lista[]>("/api/listas")
      setListas(ls)
      setError(null)
      const simbolos = [...new Set(ls.flatMap((l) => l.simbolos.map((s) => s.simbolo)))]
      if (simbolos.length > 0) {
        try {
          const r = await api<ResumenSimbolo[]>(`/api/resumen?simbolos=${simbolos.join(",")}`)
          setResumen(Object.fromEntries(r.map((x) => [x.simbolo, x])))
        } catch {
          // Sin resumen las filas muestran "—"; la lista sigue siendo útil.
        }
      }
      return ls
    } catch {
      setError("No se pudieron cargar las listas")
      setListas((actuales) => actuales ?? [])
      return undefined
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Si la pestaña activa desaparece (borrado, primera carga), caer a la primera.
  useEffect(() => {
    if (listas && !listas.some((l) => String(l.id) === tab)) {
      setTab(String(listas[0]?.id ?? ""))
    }
  }, [listas, tab])

  const ejecutar = async (accion: () => Promise<unknown>) => {
    try {
      await accion()
      await cargar()
    } catch {
      setError("Error al guardar los cambios")
    }
  }

  const crear = async () => {
    const nombre = nombreNuevo.trim()
    if (!nombre) return
    setCrearAbierto(false)
    setNombreNuevo("")
    try {
      await apiPost("/api/listas", { nombre })
      const ls = await cargar()
      const nueva = ls?.find((l) => l.nombre === nombre)
      if (nueva) setTab(String(nueva.id))
    } catch {
      setError("No se pudo crear la lista")
    }
  }

  const guardarRenombre = async () => {
    const nombre = nombreEditado.trim()
    if (!renombrar || !nombre) return
    const id = renombrar.id
    setRenombrar(null)
    await ejecutar(() => apiPut(`/api/listas/${id}`, { nombre }))
  }

  const listaActiva = listas?.find((l) => String(l.id) === tab)

  const borrarActiva = () => {
    if (!listaActiva) return
    if (!window.confirm(`¿Borrar la lista "${listaActiva.nombre}"?`)) return
    void ejecutar(() => apiDelete(`/api/listas/${listaActiva.id}`))
  }

  if (listas === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-48 w-full rounded-[14px]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Listas de seguimiento</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {listas.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-[14px] border bg-card p-10 text-center">
          <p className="text-muted-foreground">Aún no hay listas de seguimiento</p>
          <Button onClick={() => setCrearAbierto(true)}>
            <Plus /> Crear la primera lista
          </Button>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center gap-2">
            <TabsList>
              {listas.map((l) => (
                <TabsTrigger key={l.id} value={String(l.id)}>
                  {l.nombre}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Nueva lista"
              onClick={() => setCrearAbierto(true)}
            >
              <Plus />
            </Button>
            {listaActiva && (
              <span className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Renombrar lista"
                  className="text-muted-foreground"
                  onClick={() => {
                    setRenombrar(listaActiva)
                    setNombreEditado(listaActiva.nombre)
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Borrar lista"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={borrarActiva}
                >
                  <Trash2 />
                </Button>
              </span>
            )}
          </div>
          {listas.map((l) => (
            <TabsContent key={l.id} value={String(l.id)}>
              <TablaLista
                lista={l}
                resumen={resumen}
                alGuardarSimbolos={(simbolos) =>
                  void ejecutar(() => apiPut(`/api/listas/${l.id}/simbolos`, { simbolos }))
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva lista</DialogTitle>
            <DialogDescription>Nombre de la lista de seguimiento</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void crear()
            }}
            className="flex flex-col gap-3"
          >
            <Input
              autoFocus
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Cripto, Índices…"
              required
            />
            <DialogFooter>
              <Button type="submit">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renombrar !== null} onOpenChange={(abierto) => !abierto && setRenombrar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renombrar lista</DialogTitle>
            <DialogDescription>Nuevo nombre para «{renombrar?.nombre}»</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void guardarRenombre()
            }}
            className="flex flex-col gap-3"
          >
            <Input
              autoFocus
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
