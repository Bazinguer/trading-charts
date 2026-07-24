# Trading Charts — UX Patterns

> Layout, tema, login, watchlists y tablas de datos financieros.
> La entidad principal de la app es el **gráfico**: todo lo demás le sirve.

**Docs relacionados:** [BRAND.md](./BRAND.md) (tokens, colores financieros)

---

## App Shell

```
┌─────────────────────────────────────────────┐
│ Header (h-14, sticky top-0, z-50)           │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │   Main Content (flex-1)          │
│ floating │   (p-4 md:p-6, overflow-auto)    │
│ card     │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Header

- Altura `h-14`, sticky `top-0 z-50`, **sin `border-b`** (separación limpia con
  el sidebar floating card).
- Izquierda: botón sidebar toggle (icono `PanelLeft`, estilizado como card:
  `bg-card border shadow-sm rounded-lg h-10 w-10`, solo desktop `hidden md:flex`)
  + icono `CandlestickChart` + "Trading Charts".
- Derecha: toggle de tema (Sun/Moon) + menú de usuario (cerrar sesión).
- Mobile: hamburger en lugar de `PanelLeft`.

### Sidebar — Floating Card

Tarjeta flotante, no panel pegado al borde.

**Aside (contenedor externo):**
```
fixed left-0 top-14 z-40
h-[calc(100vh-3.5rem)]
p-2 pb-4
transition-all duration-200
md:sticky md:translate-x-0
```

**Card interna (lo que se ve):**
```
flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm
```

**Anchos:**
- Expanded: `w-[calc(14rem+1rem)]` → card interna 14rem (224px)
- Collapsed: `w-[calc(4rem+1rem)]` → card interna 4rem (64px)
- El `+1rem` es el padding `p-2` del aside

**Nav items expanded:**
```
flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
Activo:   bg-accent text-accent-foreground
Inactivo: text-muted-foreground hover:bg-accent hover:text-accent-foreground
```

**Nav items collapsed:** `flex h-10 w-10 items-center justify-center rounded-lg
transition-colors`, con `<Tooltip>` mostrando el label.

- Navegación mínima: **Inicio** (listas), **Gráfico** (último símbolo visto),
  **Ajustes**. Footer: versión `text-[10px] text-muted-foreground`.
- Botón toggle en el **Header** (no dentro del sidebar).
- Estado persistido en `localStorage` (`tc-sidebar-colapsado`).
- Mobile: overlay negro + slide-in desde la izquierda.

### Main Content

```tsx
<main className="flex-1 overflow-auto p-4 md:p-6">
  <Outlet />
</main>
```

**Excepción — página de gráfico:** `/grafico/:simbolo` reduce el padding
(`p-2`) y usa altura completa: el lienzo de KLineChart es el protagonista
(`flex-1 min-h-0`), no una card más entre secciones.

---

## Dark Mode (default oscuro)

- Estrategia **class-based invertida**: sin clase = oscuro (`:root`); la clase
  `.light` en `<html>` activa el claro. Ver tokens en [BRAND.md](./BRAND.md).
- Modos: binario `oscuro | claro` (sin "system" — YAGNI).
- Toggle en el Header (Sun/Moon). localStorage key `tc-tema`.
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
- Contenido de cada tab: **tabla Símbolo / Último / % Var** (formato abajo).
- **Click en fila → navega a `/grafico/:simbolo`.** Aquí el row click SÍ navega
  (no abre Sheet): el destino es la razón de ser de la app.
- **Los dibujos de AT se anclan al SÍMBOLO, no a la lista.** Un símbolo en
  varias listas comparte su análisis; las listas son solo organización de
  acceso. Borrar una lista NUNCA borra dibujos.
- Gestión mínima: crear/renombrar/borrar lista, añadir/quitar símbolos.
  Sin paginación (listas cortas por diseño).

---

## Tablas de datos financieros

### Superficie

- Contenedor: `overflow-hidden rounded-md border bg-card`.
- `TableHeader`: `bg-muted/50`.
- Filas clicables: `cursor-pointer hover:bg-muted/50`.

### Alineación (REGLA DURA)

```
Header alignment = cell alignment. SIEMPRE.

Símbolo (primera columna):        LEFT  — greedy
Cifras (precio, % var, volumen):  RIGHT + tabular-nums
Badges / acciones:                CENTER
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

### Columna primaria (stacked cell)

Símbolo `font-medium` + nombre debajo en `text-xs text-muted-foreground`
(ej.: "BTCUSDT" / "Bitcoin").

---

## Decisiones explícitas — NO hacemos

- **NO** multi-usuario / roles — login de un solo usuario.
- **NO** flujo CRUD tabla → Sheet → full page — no hay entidades de gestión;
  la app es gráfico + listas.
- **NO** React Hook Form + Zod — los formularios son triviales (login, nombre
  de lista); estado local basta.
- **NO** dark mode 3-state — binario, oscuro por defecto.
- **NO** i18n — todo en español.
- **NO** breadcrumbs ni backLinks — la navegación es plana (Inicio ↔ Gráfico).
- **NO** paginación, batch actions ni inline editing en tablas.
