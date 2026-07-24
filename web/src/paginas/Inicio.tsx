import { useCallback, useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChartCandlestick,
  ChevronsUpDown,
  LoaderCircle,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import {
  api,
  apiDelete,
  apiPost,
  apiPut,
  type Lista,
  type ResultadoBusqueda,
  type ResumenSimbolo,
  type TipoActivo,
} from "@/lib/api"
import { claseSigno, porcentaje, precio } from "@/lib/formato"
import { cn } from "@/lib/utils"

/* ── Columnas de la tabla ─────────────────────────────────────────────── */

type ColId =
  | "nombre"
  | "simbolo"
  | "ultimo"
  | "var_pct"
  | "apertura"
  | "maximo"
  | "minimo"
  | "resultados"

type Columna = { id: ColId; etiqueta: string; numerica?: boolean; fija?: boolean }

const COLUMNAS: Columna[] = [
  { id: "nombre", etiqueta: "Nombre", fija: true },
  { id: "simbolo", etiqueta: "Símbolo", fija: true },
  { id: "ultimo", etiqueta: "Último", numerica: true },
  { id: "var_pct", etiqueta: "% var.", numerica: true },
  { id: "apertura", etiqueta: "Apertura", numerica: true },
  { id: "maximo", etiqueta: "Máximo", numerica: true },
  { id: "minimo", etiqueta: "Mínimo", numerica: true },
  { id: "resultados", etiqueta: "Resultados", numerica: true },
]

type Visibilidad = Record<ColId, boolean>

// "Resultados" oculta por defecto; el resto visibles.
const VISIBILIDAD_INICIAL = Object.fromEntries(
  COLUMNAS.map((c) => [c.id, c.id !== "resultados"]),
) as Visibilidad

function cargarVisibilidad(): Visibilidad {
  try {
    const guardado = JSON.parse(localStorage.getItem("tc-columnas") ?? "{}") as Partial<Visibilidad>
    return { ...VISIBILIDAD_INICIAL, ...guardado }
  } catch {
    return VISIBILIDAD_INICIAL
  }
}

const ETIQUETA_TIPO: Record<TipoActivo, string> = {
  cripto: "Cripto",
  accion: "Acción",
  etf: "ETF",
  indice: "Índice",
  fondo: "Fondo",
}

/* ── Buscador para añadir símbolos (combobox Popover + Command) ───────── */

function BuscadorSimbolo({
  simbolos,
  alAnadir,
}: {
  simbolos: string[]
  alAnadir: (simbolo: string) => Promise<void>
}) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Búsqueda con debounce de 300 ms a partir de 2 caracteres.
  useEffect(() => {
    const q = texto.trim()
    if (q.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    let cancelado = false
    const temporizador = setTimeout(async () => {
      try {
        const r = await api<ResultadoBusqueda[]>(`/api/buscar?q=${encodeURIComponent(q)}`)
        if (!cancelado) {
          setResultados(r)
          setError(null)
        }
      } catch {
        if (!cancelado) {
          setResultados([])
          setError("No se pudo buscar")
        }
      } finally {
        if (!cancelado) setBuscando(false)
      }
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [texto])

  const elegir = async (r: ResultadoBusqueda) => {
    if (descargando) return
    setDescargando(r.simbolo)
    setError(null)
    try {
      // Primero asegurar el histórico en disco; después añadir a la lista.
      await apiPost(`/api/datos/${encodeURIComponent(r.simbolo)}`, {
        fuente: r.fuente,
        nombre: r.nombre,
        tipo: r.tipo,
      })
      await alAnadir(r.simbolo)
      setAbierto(false)
      setTexto("")
    } catch {
      setError(`No se pudo descargar el histórico de ${r.simbolo}`)
    } finally {
      setDescargando(null)
    }
  }

  return (
    <Popover
      open={abierto}
      onOpenChange={(o) => {
        setAbierto(o)
        if (!o) {
          setTexto("")
          setError(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={abierto}
          className="w-64 justify-between font-normal text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Plus /> Añadir símbolo…
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Busca por símbolo o nombre…"
            value={texto}
            onValueChange={setTexto}
          />
          <CommandList>
            {error && <p className="border-b px-3 py-2 text-xs text-destructive">{error}</p>}
            {descargando ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Descargando histórico de {descargando}…
              </p>
            ) : (
              <>
                <CommandEmpty>
                  {texto.trim().length < 2
                    ? "Escribe al menos 2 caracteres"
                    : buscando
                      ? "Buscando…"
                      : "Sin resultados"}
                </CommandEmpty>
                {resultados.length > 0 && (
                  <CommandGroup>
                    {resultados.map((r) => {
                      const enLista = simbolos.includes(r.simbolo)
                      return (
                        <CommandItem
                          key={`${r.fuente}:${r.simbolo}`}
                          value={`${r.fuente}:${r.simbolo}`}
                          disabled={enLista}
                          onSelect={() => void elegir(r)}
                        >
                          <span className="font-medium">{r.simbolo}</span>
                          <span className="truncate text-muted-foreground">{r.nombre}</span>
                          <Badge variant="secondary" className="ml-auto shrink-0">
                            {enLista ? "En la lista" : ETIQUETA_TIPO[r.tipo]}
                          </Badge>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ── Tabla de una lista ───────────────────────────────────────────────── */

type Orden = { col: ColId; dir: "asc" | "desc" } | null

function CabeceraOrdenable({
  columna,
  orden,
  alOrdenar,
}: {
  columna: Columna
  orden: Orden
  alOrdenar: (col: ColId) => void
}) {
  const dir = orden?.col === columna.id ? orden.dir : null
  const Icono = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => alOrdenar(columna.id)}
      className={cn(
        "h-8 gap-1 px-2.5",
        columna.numerica ? "-mr-2.5" : "-ml-2.5",
        !dir && "[&_svg]:opacity-40",
      )}
    >
      {columna.etiqueta}
      <Icono className="size-3.5" />
    </Button>
  )
}

function Celda({ col, simbolo, r }: { col: Columna; simbolo: string; r?: ResumenSimbolo }) {
  switch (col.id) {
    case "nombre":
      return <TableCell className="text-muted-foreground">{r?.nombre ?? "—"}</TableCell>
    case "simbolo":
      return <TableCell className="font-medium">{simbolo}</TableCell>
    case "var_pct":
      return (
        <TableCell className={cn("text-right tabular-nums", claseSigno(r?.var_pct))}>
          {r?.var_pct != null ? porcentaje(r.var_pct) : "—"}
        </TableCell>
      )
    case "resultados":
      return <TableCell className="text-right text-muted-foreground">—</TableCell>
    default: {
      const valor = r?.[col.id]
      return (
        <TableCell className="text-right tabular-nums">
          {valor != null ? precio(valor) : "—"}
        </TableCell>
      )
    }
  }
}

function TablaLista({
  lista,
  resumen,
  visibles,
  alCambiarColumna,
  alGuardarSimbolos,
}: {
  lista: Lista
  resumen: Record<string, ResumenSimbolo>
  visibles: Visibilidad
  alCambiarColumna: (col: ColId, visible: boolean) => void
  alGuardarSimbolos: (simbolos: string[]) => Promise<void>
}) {
  const navegar = useNavigate()
  const [orden, setOrden] = useState<Orden>(null)
  const simbolos = [...lista.simbolos].sort((a, b) => a.orden - b.orden).map((s) => s.simbolo)
  const columnasVisibles = COLUMNAS.filter((c) => visibles[c.id])

  const alOrdenar = (col: ColId) =>
    setOrden((o) =>
      o?.col !== col ? { col, dir: "asc" } : o.dir === "asc" ? { col, dir: "desc" } : null,
    )

  const valorCelda = (simbolo: string, col: ColId): string | number | null => {
    if (col === "simbolo") return simbolo
    if (col === "resultados") return null
    const r = resumen[simbolo]
    return r?.[col] ?? null
  }

  // Sin ordenación se respeta el orden de la lista; nulls siempre al final.
  const ordenados = orden
    ? [...simbolos].sort((a, b) => {
        const va = valorCelda(a, orden.col)
        const vb = valorCelda(b, orden.col)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        const resultado =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb), "es")
        return orden.dir === "asc" ? resultado : -resultado
      })
    : simbolos

  const irAlGrafico = (simbolo: string) =>
    navegar(`/grafico/${encodeURIComponent(simbolo)}`, { state: { from: "/" } })

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BuscadorSimbolo
          simbolos={simbolos}
          alAnadir={(simbolo) => alGuardarSimbolos([...simbolos, simbolo])}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              <Settings2 /> Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {COLUMNAS.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={visibles[c.id]}
                disabled={c.fija}
                onCheckedChange={(marcado) => alCambiarColumna(c.id, marcado === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {c.etiqueta}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columnasVisibles.map((c) => (
              <TableHead key={c.id} className={cn(c.numerica && "text-right")}>
                <CabeceraOrdenable columna={c} orden={orden} alOrdenar={alOrdenar} />
              </TableHead>
            ))}
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenados.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnasVisibles.length + 1}
                className="py-6 text-center text-muted-foreground"
              >
                Lista vacía: usa «Añadir símbolo» para empezar
              </TableCell>
            </TableRow>
          )}
          {ordenados.map((simbolo) => {
            const r = resumen[simbolo]
            return (
              <TableRow
                key={simbolo}
                className="cursor-pointer"
                onClick={() => irAlGrafico(simbolo)}
              >
                {columnasVisibles.map((c) => (
                  <Celda key={c.id} col={c} simbolo={simbolo} r={r} />
                ))}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Ver gráfico de ${simbolo}`}
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      irAlGrafico(simbolo)
                    }}
                  >
                    <ChartCandlestick />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Quitar ${simbolo}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      void alGuardarSimbolos(simbolos.filter((s) => s !== simbolo))
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
    </div>
  )
}

/* ── Página ───────────────────────────────────────────────────────────── */

export function Inicio() {
  const [listas, setListas] = useState<Lista[] | null>(null)
  const [resumen, setResumen] = useState<Record<string, ResumenSimbolo>>({})
  const [tab, setTab] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [renombrar, setRenombrar] = useState<Lista | null>(null)
  const [nombreEditado, setNombreEditado] = useState("")
  const [visibles, setVisibles] = useState<Visibilidad>(cargarVisibilidad)

  useEffect(() => {
    localStorage.setItem("tc-columnas", JSON.stringify(visibles))
  }, [visibles])

  const cargar = useCallback(async (): Promise<Lista[] | undefined> => {
    try {
      const ls = await api<Lista[]>("/api/listas")
      setListas(ls)
      setError(null)
      const simbolos = [...new Set(ls.flatMap((l) => l.simbolos.map((s) => s.simbolo)))]
      if (simbolos.length > 0) {
        try {
          const r = await api<ResumenSimbolo[]>(
            `/api/resumen?simbolos=${encodeURIComponent(simbolos.join(","))}`,
          )
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

  const ejecutar = async (accion: () => Promise<unknown>): Promise<void> => {
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
                visibles={visibles}
                alCambiarColumna={(col, visible) =>
                  setVisibles((v) => ({ ...v, [col]: visible }))
                }
                alGuardarSimbolos={(simbolos) =>
                  ejecutar(() => apiPut(`/api/listas/${l.id}/simbolos`, { simbolos }))
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
