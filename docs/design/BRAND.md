# Trading Charts — Brand & Design Tokens

> Base visual de charts.bazinguer.es. Colores, tipografía, espaciado e iconos.
> Cargar este doc al trabajar en CSS, estilos o componentes visuales.

**Docs relacionados:** [UX_PATTERNS.md](./UX_PATTERNS.md) (layout, login, tablas, watchlists)

---

## Identidad

- **Nombre:** Trading Charts — proyecto personal (Bazinguer). Sin logo propio.
- **Marca en header:** icono Lucide `CandlestickChart` + texto "Trading Charts".
- **Base visual:** hereda el sistema JomBotix/Crypto Lab — mismo azul UI, misma
  escala slate, mismos tokens. Es un color de interfaz, no marca corporativa.
- **Tema por defecto: OSCURO.** App de trading con sesiones largas frente al
  gráfico. El claro existe como override (`.light`), no al revés.

---

## Tema oscuro como default

Los tokens oscuros viven en `:root` y los claros en `.light` (invertido respecto
a las apps JomBotix). Por qué: sin clase alguna la app ya se ve bien en oscuro
(cero flash claro al cargar) y el modo mayoritario no paga peaje de overrides.

---

## Paleta de colores

### Primary (UI Blue)

| Token | Oscuro (default) | Claro (`.light`) | Uso |
|---|---|---|---|
| `--primary` | `#38BDF8` | `#0EA5E9` | Botones, links, active states |
| `--primary-foreground` | `#0F1623` | `#FFFFFF` | Texto sobre primary |
| `--accent` | `#193046` | `#F0F9FF` | Fondos accent suaves (primary ~10% sobre card) |
| `--accent-foreground` | `#7DD3FC` | `#0369A1` | Texto sobre accent |
| `--ring` | `#38BDF8` | `#0EA5E9` | Focus rings (= primary) |

### Neutral (Slate)

| Token | Oscuro (default) | Claro (`.light`) | Uso |
|---|---|---|---|
| `--background` | `#0F1623` | `#F8FAFC` | Fondo de página |
| `--foreground` | `#F1F5F9` | `#0F172A` | Texto principal |
| `--card` | `#162032` | `#FFFFFF` | Cards, sidebar, paneles, tablas |
| `--card-foreground` | `#F1F5F9` | `#0F172A` | Texto en cards |
| `--popover` | `#162032` | `#FFFFFF` | Dropdowns, popovers |
| `--secondary` | `#1E293B` | `#F1F5F9` | Botones secundarios, badges |
| `--muted` | `#1E293B` | `#F1F5F9` | Fondos deshabilitados |
| `--muted-foreground` | `#94A3B8` | `#64748B` | Texto secundario, placeholders |
| `--border` | `#2A3548` | `#E2E8F0` | Bordes, separadores |
| `--input` | `#2A3548` | `#E2E8F0` | Bordes de inputs |

En oscuro: fondos slate (nunca negro puro), cards algo más claras que el fondo
para dar profundidad, y los **bordes** separan superficies (sombras casi nulas).

### Semánticos

| Token | Oscuro (default) | Claro (`.light`) | Uso |
|---|---|---|---|
| `--success` | `#22C55E` | `#16A34A` | Subida, confirmaciones |
| `--destructive` | `#EF4444` | `#DC2626` | Bajada, errores, delete |
| `--warning` | `#F59E0B` | `#F59E0B` | Avisos, datos desactualizados |
| `--info` | = primary | = primary | Informativo |

### Badges de estado

```
Positivo/subida:  bg-success/10 text-success
Negativo/bajada:  bg-destructive/10 text-destructive
Aviso:            bg-warning/10 text-warning
Neutro:           variant="secondary"
```

---

## Colores financieros

**Verde = subida · Rojo = bajada. Reservados.** Se usan los semánticos
`success`/`destructive` ya definidos — no hay una segunda paleta.

- Aplican a: precios que suben/bajan, variaciones %, velas del gráfico.
- Verde/rojo NUNCA como decoración ni como color de identidad de otra cosa.
- El color nunca es el único indicador: toda variación lleva **signo explícito**
  (`+4,21 %` / `−1,83 %`) además del color.
- **Texto pequeño** de variación (tablas, tooltips): los semánticos no
  contrastan bien como texto; usar pasos de texto por signo:

| Token | Oscuro (default) | Claro (`.light`) |
|---|---|---|
| `--gain-text` | `#4ADE80` (green-400) | `#15803D` (green-700) |
| `--loss-text` | `#F87171` (red-400) | `#B91C1C` (red-700) |

- **Velas KLineChart:** hoy usan los defaults de la librería. En una fase
  posterior se alinearán con estos tokens vía `chart.setStyles()` (cuerpo y
  mecha de vela alcista = success, bajista = destructive, en ambos temas).

---

## Tipografía

- **Fuente:** Inter (Google Fonts). Fallback `Inter, ui-sans-serif, system-ui, sans-serif`.
- **Body 14px** (densidad de dashboard). Features OpenType: `cv02, cv03, cv04, cv11`.
- **`tabular-nums` obligatorio** en precios, columnas numéricas y ejes del
  gráfico: las cifras no bailan al cambiar dígitos.

| Rol | Tailwind | Tamaño | Peso |
|---|---|---|---|
| Título de página | `text-2xl font-semibold tracking-tight` | 24px | 600 |
| Título de sección | `text-lg font-semibold` | 18px | 600 |
| Título de card | `text-base font-medium` | 16px | 500 |
| Body | `text-sm` | 14px | 400 |
| Small | `text-xs` | 12px | 400 |
| Precio destacado | `text-2xl font-bold tabular-nums` | 24px | 700 |

---

## Espaciado, radios y sombras

- Espaciado: `gap-6` entre secciones de página · `gap-2` entre badges ·
  `p-4` padding de card. El layout gestiona el padding de página.
- Radios: base `--radius: 0.75rem`. `rounded-lg` cards/tablas ·
  `rounded-md` botones/inputs · `rounded-xl` sidebar/modales · `rounded-full` pills.
- Sombras: `shadow-sm` cards en reposo · `shadow-md` dropdowns · `shadow-lg`
  modales. **En oscuro (default): menos sombra, más borde.**

---

## Iconografía

- **Lucide React exclusivamente**, siempre `currentColor`. **Sin emojis en la UI.**
- Inline `h-4 w-4` · headers de sección `h-5 w-5` · empty states `h-6 w-6`.
- Sugerencias de dominio: `CandlestickChart` (marca), `Star` (watchlist),
  `TrendingUp/Down` (variación), `PenLine` (dibujos), `Sun/Moon` (tema),
  `LogIn/LogOut` (sesión).

---

## Scrollbars

Personalizadas globales: 6px, track transparente, thumb color `border`
redondeado, hover `muted-foreground/50`.

---

## Variables CSS (Tailwind v4)

Valores hex completos (sin la convención HSL-sin-wrapper de Tailwind v3).
Oscuro en `:root`, claro en `.light`, y `@theme inline` los expone como
utilidades (`bg-background`, `text-gain`, `border-border`…):

```css
:root {
  /* Tema OSCURO — default */
  --background: #0F1623;
  --card: #162032;
  --border: #2A3548;
  --primary: #38BDF8;
  --gain-text: #4ADE80;
  --loss-text: #F87171;
  /* ...resto de tokens de las tablas de arriba */
}

.light {
  --background: #F8FAFC;
  --card: #FFFFFF;
  --border: #E2E8F0;
  --primary: #0EA5E9;
  --gain-text: #15803D;
  --loss-text: #B91C1C;
  /* ... */
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-gain: var(--gain-text);
  --color-loss: var(--loss-text);
  /* ... */
}
```

---

## Do / Don't

| Do | Don't |
|---|---|
| `primary` para interactivos | Hex azul hardcodeado en componentes |
| Verde/rojo SOLO para subida/bajada | Verde/rojo como decoración |
| Signo explícito en toda variación | Color como único indicador |
| `tabular-nums` en cifras | Números bailando al actualizar |
| Lucide exclusivamente | Emojis o mezclar librerías de iconos |
| Oscuro en `:root`, claro en `.light` | Bloques `.dark {}` (aquí no existen) |
