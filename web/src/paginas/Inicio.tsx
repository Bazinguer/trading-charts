import { useCallback, useEffect, useState, type ComponentType } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronsUpDown,
  Clock,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
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
import { claseSigno, fechaCorta, porcentaje, precio } from "@/lib/formato"
import { cn } from "@/lib/utils"

/* ── Columnas de la tabla ─────────────────────────────────────────────── */

type ColId =
  | "nombre"
  | "simbolo"
  | "ultimo"
  | "ampliado"
  | "ampliado_pct"
  | "apertura"
  | "maximo"
  | "minimo"
  | "var_pct"
  | "resultados"

type Columna = {
  id: ColId
  etiqueta: string
  // Cabecera compacta opcional: icono + abreviatura (la etiqueta completa
  // queda en el tooltip y en el menú "Columnas").
  abreviatura?: string
  icono?: ComponentType<{ className?: string }>
  numerica?: boolean
  fija?: boolean
  ocultaInicial?: boolean
}

// Orden fijo estilo Investing: precio y ampliado primero, % var. al final.
const COLUMNAS: Columna[] = [
  { id: "nombre", etiqueta: "Nombre", fija: true },
  { id: "simbolo", etiqueta: "Símbolo", fija: true },
  { id: "ultimo", etiqueta: "Último", numerica: true },
  {
    id: "ampliado",
    etiqueta: "Horario ampliado",
    abreviatura: "Amp.",
    icono: Clock,
    numerica: true,
    ocultaInicial: true,
  },
  {
    id: "ampliado_pct",
    etiqueta: "Horario ampliado (%)",
    abreviatura: "Amp. %",
    icono: Clock,
    numerica: true,
    ocultaInicial: true,
  },
  { id: "apertura", etiqueta: "Apertura", numerica: true },
  { id: "maximo", etiqueta: "Máximo", numerica: true },
  { id: "minimo", etiqueta: "Mínimo", numerica: true },
  { id: "var_pct", etiqueta: "% var.", numerica: true },
  { id: "resultados", etiqueta: "Próx. resultados", numerica: true, ocultaInicial: true },
]

type Visibilidad = Record<ColId, boolean>

const VISIBILIDAD_INICIAL = Object.fromEntries(
  COLUMNAS.map((c) => [c.id, !c.ocultaInicial]),
) as Visibilidad

// Visibilidad POR LISTA: { [listaId]: { [columnaId]: boolean } }. Se guardan
// solo las diferencias respecto a los defaults; al leer se completan. La clave
// antigua "tc-columnas" (visibilidad global) queda ignorada a propósito.
const CLAVE_COLUMNAS = "tc-columnas-v2"

type VisibilidadPorLista = Record<string, Partial<Visibilidad>>

function cargarVisibilidadPorLista(): VisibilidadPorLista {
  try {
    const crudo: unknown = JSON.parse(localStorage.getItem(CLAVE_COLUMNAS) ?? "{}")
    return typeof crudo === "object" && crudo !== null ? (crudo as VisibilidadPorLista) : {}
  } catch {
    return {}
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
          className="w-64 justify-between font-normal"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="text-primary" /> Añadir símbolo…
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
  // Patrón serps: cabecera ordenable como texto plano con flecha, no botón ghost.
  return (
    <button
      type="button"
      onClick={() => alOrdenar(columna.id)}
      aria-label={`Ordenar por ${columna.etiqueta}`}
      title={columna.abreviatura ? columna.etiqueta : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        dir ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {columna.icono && <columna.icono className="h-3.5 w-3.5" aria-hidden="true" />}
      {columna.abreviatura ?? columna.etiqueta}
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
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
    case "ampliado_pct":
      return (
        <TableCell className={cn("text-right tabular-nums", claseSigno(r?.ampliado_pct))}>
          {r?.ampliado_pct != null ? porcentaje(r.ampliado_pct) : "—"}
        </TableCell>
      )
    case "resultados":
      return (
        <TableCell className="text-right tabular-nums">
          {r?.resultados ? fechaCorta(r.resultados) : "—"}
        </TableCell>
      )
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
  alRenombrar,
  alBorrar,
}: {
  lista: Lista
  resumen: Record<string, ResumenSimbolo>
  visibles: Visibilidad
  alCambiarColumna: (col: ColId, visible: boolean) => void
  alGuardarSimbolos: (simbolos: string[]) => Promise<void>
  alRenombrar: () => void
  alBorrar: () => void
}) {
  const navegar = useNavigate()
  const [orden, setOrden] = useState<Orden>(null)
  const simbolos = [...lista.simbolos].sort((a, b) => a.orden - b.orden).map((s) => s.simbolo)
  const columnasVisibles = COLUMNAS.filter((c) => visibles[c.id])

  const alOrdenar = (col: ColId) =>
    setOrden((o) =>
      o?.col !== col ? { col, dir: "asc" } : o.dir === "asc" ? { col, dir: "desc" } : null,
    )

  // "resultados" es "YYYY-MM-DD": como texto ordena bien cronológicamente.
  const valorCelda = (simbolo: string, col: ColId): string | number | null => {
    if (col === "simbolo") return simbolo
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
    <div className="flex flex-col gap-3">
      {/* Toolbar FUERA del borde de la tabla (patrón DS) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BuscadorSimbolo
          simbolos={simbolos}
          alAnadir={(simbolo) => alGuardarSimbolos([...simbolos, simbolo])}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-fit text-muted-foreground">
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
        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Renombrar lista"
            title="Renombrar lista"
            className="text-muted-foreground"
            onClick={alRenombrar}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Borrar lista"
            title="Borrar lista"
            className="text-muted-foreground hover:text-destructive"
            onClick={alBorrar}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        {ordenados.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="Lista vacía"
            description="Usa «Añadir símbolo» para empezar a seguir tus activos."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columnasVisibles.map((c) => (
                  <TableHead key={c.id} className={cn(c.numerica && "text-right")}>
                    <CabeceraOrdenable columna={c} orden={orden} alOrdenar={alOrdenar} />
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver gráfico de ${simbolo}`}
                          title="Ver gráfico"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            irAlGrafico(simbolo)
                          }}
                        >
                          <ArrowUpRight />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar ${simbolo} de la lista`}
                          title="Quitar de la lista"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            void alGuardarSimbolos(simbolos.filter((s) => s !== simbolo))
                          }}
                        >
                          <X />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
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
  const [visiblesPorLista, setVisiblesPorLista] =
    useState<VisibilidadPorLista>(cargarVisibilidadPorLista)

  useEffect(() => {
    localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(visiblesPorLista))
  }, [visiblesPorLista])

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

  const borrar = (lista: Lista) => {
    if (!window.confirm(`¿Borrar la lista "${lista.nombre}"?`)) return
    void ejecutar(() => apiDelete(`/api/listas/${lista.id}`))
  }

  if (listas === null) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Listas de seguimiento"
        description="Agrupa tus activos por listas y salta a su gráfico"
        icon={ListChecks}
      >
        <Button onClick={() => setCrearAbierto(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva lista
        </Button>
      </PageHeader>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {listas.length === 0 ? (
        <div className="overflow-hidden rounded-md border bg-card">
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="Aún no hay listas de seguimiento"
            description="Crea la primera lista para agrupar los símbolos que quieres vigilar."
            action={
              <Button onClick={() => setCrearAbierto(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nueva lista
              </Button>
            }
          />
        </div>
      ) : (
        // Tabs underline: decisión canónica del DS (el pill default de shadcn, no).
        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <TabsList className="h-11 w-full justify-start rounded-none border-b bg-transparent p-0">
            {listas.map((l) => (
              <TabsTrigger
                key={l.id}
                value={String(l.id)}
                // flex-none y border-0 neutralizan el flex-1 y el borde 1px del
                // primitivo pill; tailwind-merge conserva el border-b-2 posterior.
                className="relative flex-none rounded-none border-0 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {l.nombre}
              </TabsTrigger>
            ))}
          </TabsList>
          {listas.map((l) => (
            <TabsContent key={l.id} value={String(l.id)} className="mt-6">
              <TablaLista
                lista={l}
                resumen={resumen}
                visibles={{ ...VISIBILIDAD_INICIAL, ...visiblesPorLista[String(l.id)] }}
                alCambiarColumna={(col, visible) =>
                  setVisiblesPorLista((m) => ({
                    ...m,
                    [String(l.id)]: { ...m[String(l.id)], [col]: visible },
                  }))
                }
                alGuardarSimbolos={(simbolos) =>
                  ejecutar(() => apiPut(`/api/listas/${l.id}/simbolos`, { simbolos }))
                }
                alRenombrar={() => {
                  setRenombrar(l)
                  setNombreEditado(l.nombre)
                }}
                alBorrar={() => borrar(l)}
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
