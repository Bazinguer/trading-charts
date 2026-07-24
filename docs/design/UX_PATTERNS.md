# Trading Charts — UX Patterns

> Layout, tema, login, watchlists, buscador y DataTable financiera.
> La entidad principal de la app es el **gráfico**: todo lo demás le sirve.

**Docs relacionados:** [BRAND.md](./BRAND.md) (tokens, colores financieros)

---

## App Shell

Sin sidebar. Una top bar a ancho completo y el contenido debajo.

```
┌─────────────────────────────────────────────┐
│ Top bar (h-14, sticky top-0, z-50)          │
│ Logo      Inicio | Gráficos     [tema] [⏻] │
├─────────────────────────────────────────────┤
│                                             │
│   Main Content (flex-1)                     │
│   (p-4 md:p-6, overflow-auto)               │
│                                             │
└─────────────────────────────────────────────┘
```

### Top bar

- Altura `h-14`, sticky `top-0 z-50`, ancho completo.
- Izquierda: icono `CandlestickChart` + "Trading Charts".
- Centro: nav **Inicio | Gráficos**, estado activo por ruta
  (`text-foreground` activo, `text-muted-foreground hover:text-foreground`
  inactivo).
- Derecha: toggle de tema (Sun/Moon) + cerrar sesión.

### Main Content

```tsx
<main className="flex-1 overflow-auto p-4 md:p-6">
  <Outlet />
</main>
```

**REGLA — sin `max-width` ni `container`:** la pantalla ultra-wide se
aprovecha entera. El ancho solo se acota en formularios dentro de `Dialog`.

**Excepción — `/grafico/:simbolo`:** casi full-bleed (`p-2`, lienzo
`flex-1 min-h-0`): KLineChart es el protagonista, no una card más. Es la
**única** vista con columna lateral: una barra vertical fina de herramientas
de dibujo pegada al lienzo (estilo TradingView/Investing). Es contextual del
gráfico — nunca navegación global.

---

## Volver (backLink estilo iOS)

Adaptado del `PageHeader` de jd-facturacion: Link pequeño arriba a la
izquierda, sin breadcrumbs.

```tsx
<Link
  to={destino}
  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
>
  <ChevronLeft className="h-3.5 w-3.5" />
  {etiqueta}
</Link>
```

- Navega a la **ruta padre explícita**, no `history.back()` (un refresh o un
  enlace directo no deben romperlo).
- Si hay varios orígenes posibles, el origen viaja en `state.from`.
- Uso: `/grafico/:simbolo` vuelve a **Inicio** o a **/graficos** según de
  dónde se llegó.

---

## Dark Mode (default oscuro)

- Estrategia **class-based invertida**: sin clase = oscuro (`:root`); la clase
  `.light` en `<html>` activa el claro. Ver tokens en [BRAND.md](./BRAND.md).
- Modos: binario `oscuro | claro` (sin "system" — YAGNI).
- Toggle en la top bar (Sun/Moon). localStorage key `tc-tema`.
- Implementación: **contexto React** (`ProveedorTema`), no módulo TS puro.
  Por qué: el gráfico KLineChart no se restyla con CSS — `Grafico` necesita
  reaccionar al cambio de tema y llamar a `chart.setStyles()`.

```tsx
type Tema = 'oscuro' | 'claro';

const ContextoTema = createContext<{ tema: Tema; alternar: () => void } | null>(null);

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(
    () => (localStorage.getItem('tc-tema') as Tema) ?? 'oscuro',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('light', tema === 'claro');
    localStorage.setItem('tc-tema', tema);
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));

  return (
    <ContextoTema.Provider value={{ tema, alternar }}>
      {children}
    </ContextoTema.Provider>
  );
}
```

---

## Login

Un solo usuario. Sin registro, sin recuperación de contraseña, sin roles.

### Layout

```
┌──────────────────────────────────────┐
│                                      │
│      [CandlestickChart icon]         │
│         TRADING CHARTS               │
│                                      │
│      ┌────────────────────┐          │
│      │   Iniciar sesión   │          │
│      │                    │          │
│      │   [Usuario     ]   │ ← Card   │
│      │   [Contraseña  ]   │          │
│      │                    │          │
│      │   [Iniciar sesión] │          │
│      └────────────────────┘          │
│                                      │
└──────────────────────────────────────┘
```

### Elementos

- **Marca:** icono `CandlestickChart` (`h-10 w-10 text-primary`) + "TRADING
  CHARTS" (`text-lg font-semibold tracking-wide text-primary`).
- **Card:** `max-w-md shadow-lg border-border/50`, centrada, con glow exterior
  (`bg-primary/5 blur-2xl`).
- **Título:** "Iniciar sesión" (`text-2xl font-bold text-center`).
- **Campos:** Usuario (icono `User`) + Contraseña (icono `Lock`). Iconos
  prefijados dentro del input (`pl-10`).
- **Botón submit:** full width, `size="lg"`, icono `LogIn`. Loading con
  `Loader2` spinner.

### Fondo (sobre el tema oscuro por defecto)

- Base: `bg-background` (`#0F1623`).
- Gradiente radial central: primary al 10% (`#38BDF8` / 0.10) — presencia de
  marca sutil.
- Gradiente radial top-right al 5% — asimetría.
- Grid pattern: líneas primary cada 60px, `opacity-[0.05]` — estética
  técnica/terminal.

---

## Listas de seguimiento (watchlist)

**Inicio** (`/`) es el punto de entrada tras el login.

- **Tabs — una por lista** ("Cripto", "Índices", "Acciones"…), estilo underline:

```tsx
<TabsList className="h-11 w-full justify-start rounded-none border-b bg-transparent p-0">
  <TabsTrigger
    value="..."
    className="relative rounded-none border-b-2 border-transparent px-4 py-2.5
      text-sm font-medium text-muted-foreground
      data-[state=active]:border-primary data-[state=active]:text-foreground
      data-[state=active]:bg-transparent data-[state=active]:shadow-none"
  />
</TabsList>
```

- Última tab activa persistida (`localStorage` `tc-lista-activa`).
- Contenido de cada tab: la **DataTable financiera** (ver más abajo); click
  en fila → `/grafico/:simbolo`.
- **Los dibujos de AT se anclan al SÍMBOLO, no a la lista.** Un símbolo en
  varias listas comparte su análisis; las listas son solo organización de
  acceso. Borrar una lista NUNCA borra dibujos.
- Gestión mínima: crear/renombrar/borrar lista, añadir/quitar símbolos.
  Sin paginación (listas cortas por diseño).

---

## Buscador de símbolos

Combobox (`Popover` + `Command`) con búsqueda en vivo multi-fuente:
catálogo de Binance cacheado + búsqueda en Yahoo.

- Cada resultado lleva un badge del tipo de activo: Cripto / Acción / ETF /
  Índice / Fondo.
- Al seleccionar un símbolo nuevo se descarga su histórico automáticamente,
  con estado "Descargando…" mientras dura.

---

## DataTable financiera

La tabla de símbolos (tabs de Inicio y `/graficos`).

### Columnas

Nombre · Símbolo · Último · % var. · Apertura · Máximo · Mínimo ·
Resultados · Acciones.

- **Resultados** (earnings): oculta por defecto hasta que haya datos.
- **Acciones**: botón explícito al gráfico; la fila entera también navega
  (aquí el row click SÍ navega, no abre Sheet: el destino es la razón de ser
  de la app).

### Ordenación y visibilidad

- Click en cabecera cicla **asc → desc**. Iconos: `ArrowUpDown` (sin orden),
  `ArrowUp`, `ArrowDown`.
- Botón "Columnas" con `DropdownMenuCheckboxItem` por columna; visibilidad
  persistida en `localStorage` (`tc-columnas`).

### Superficie

- Contenedor: `overflow-hidden rounded-md border bg-card`.
- `TableHeader`: `bg-muted/50`.
- Filas clicables: `cursor-pointer hover:bg-muted/50`.

### Alineación (REGLA DURA)

```
Header alignment = cell alignment. SIEMPRE.

Texto (Nombre, Símbolo):                 LEFT  — Nombre greedy
Cifras (Último, % var., OHLC, volumen):  RIGHT + tabular-nums
Badges / Resultados / Acciones:          CENTER
```

Las cifras van a la DERECHA (a diferencia del DS JomBotix, que centra):
comparar magnitudes exige dígitos alineados verticalmente.

### Formato de números (`Intl.NumberFormat('es-ES')`)

| Contexto | Formato | Ejemplo |
|---|---|---|
| Precio ≥ 1 | 2 decimales, miles con punto | `43.250,12` |
| Precio < 1 | 4-6 decimales significativos | `0,08432` |
| Variación % | **signo explícito** + 2 decimales | `+4,21 %` / `−1,83 %` |
| Volumen | notación compacta | `1,2 M` |

### Variación con color

Verde subida / rojo bajada con los tokens de texto de BRAND.md
(`text-gain` / `text-loss`), nunca los semánticos de badge como texto pequeño:

```tsx
function VariacionPct({ valor }: { valor: number }) {
  const color = valor > 0 ? 'text-gain' : valor < 0 ? 'text-loss' : 'text-muted-foreground';
  const signo = valor > 0 ? '+' : ''; // el negativo ya trae su signo
  return (
    <span className={`tabular-nums ${color}`}>
      {signo}{valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
    </span>
  );
}
```

---

## Decisiones explícitas — NO hacemos

- **NO** multi-usuario / roles — login de un solo usuario.
- **NO** flujo CRUD tabla → Sheet → full page — no hay entidades de gestión;
  la app es gráfico + listas.
- **NO** React Hook Form + Zod — los formularios son triviales (login, nombre
  de lista); estado local basta.
- **NO** dark mode 3-state — binario, oscuro por defecto.
- **NO** i18n — todo en español.
- **NO** breadcrumbs — el backLink de una línea basta (ver "Volver").
- **NO** sidebar ni barras laterales globales — la única columna lateral es la
  de herramientas de dibujo en `/grafico` (contextual).
- **NO** paginación, batch actions ni inline editing en tablas.
