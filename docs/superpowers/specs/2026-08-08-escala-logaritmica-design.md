# Escala logarítmica en el gráfico

**Fecha:** 2026-08-08 · **Estado:** aprobado, pendiente de implementar

## Problema

En escala lineal la distancia vertical mide **euros**, no **rentabilidad**. El
S&P de 1000→2000 (+100%) ocupa la mitad de píxeles que 4000→6000 (+50%): el ojo
lee "pendiente" creyendo leer rentabilidad, y la serie parece insostenible al
final y plana al principio. En escala logarítmica la misma pendiente es la misma
tasa de retorno, y las caídas de 1987, 2000, 2008 y 2020 quedan a un tamaño
proporcional al daño que hicieron.

La escala correcta depende del recorrido visible: con multiplicadores ×3 o más
manda log; en rangos del ~30-40% (casi todo el intradía y el swing) log y lineal
son indistinguibles y en lineal se razonan mejor soportes horizontales y cajas
de rango. Por eso la escala es una decisión **por símbolo**, no una preferencia
global ni una regla universal.

## Decisiones tomadas

### 1. La escala se guarda por símbolo, junto al análisis

Igual que los indicadores activos: en `dibujos.db`, con el mismo botón de
guardar. El S&P queda en log para siempre; BTCUSDT sigue en lineal.

Esto resuelve el problema de fondo sin duplicar nada: una directriz se ve
distinta en cada escala (una recta en lineal *es* una curva logarítmica en log —
misma información, dos proyecciones), así que lo que importa es **volver a abrir
el símbolo en la escala en la que lo dibujaste**. Con la escala guardada eso
pasa solo.

### 2. NO se duplican los dibujos por escala

Se evaluó y se descartó:

- Ni TradingView ni KLineChart lo soportan. Lo que circula como solución en
  TradingView es un apaño manual con el Object Tree.
- Contradice una decisión ya fijada en `CLAUDE.md` (dibujos por símbolo, **no**
  por símbolo+timeframe) por las mismas razones.
- Duplica el mantenimiento del análisis, no la información.
- Toca el esquema de `dibujos.db`, lo más delicado del proyecto.

### 3. Los niveles del Fibonacci son fracción del rango de PRECIO

El overlay hacía dos interpolaciones en paralelo: la posición en píxeles
(`fibonacci.ts:99`) y la etiqueta en precio (`fibonacci.ts:134`). En lineal
coinciden exactamente; en log se separan y la etiqueta contradice a la línea.

Se unifica en una sola dirección: **el nivel se calcula en precio y el eje
decide su altura** (`convertToPixel`). Línea y etiqueta no pueden discrepar en
ninguna escala, y en log los niveles salen comprimidos hacia arriba.

Se evaluó la alternativa (repartir el espacio visual y derivar el precio de la
altura, es decir retroceso geométrico en log) y se descartó tras medirla sobre
el análisis real del S&P, donde movía el 0.5 de 5.582,53 a 5.202,88 — un 7%:

- Es el default de TradingView, que trae "Fib levels based on log scale"
  DESACTIVADO, y el estándar del sector. Coincidir importa: un nivel de
  Fibonacci saca su fuerza del consenso de quienes miran el mismo número.
- Un fibo guardado conserva su significado aunque se cambie la escala, que es
  el propósito de esta app.
- No cuesta coherencia: ambas variantes sitúan la línea vía el eje, así que
  ninguna es un apaño. La diferencia es solo qué SIGNIFICA el nivel.

La casilla por dibujo de TradingView queda como añadido futuro, no ahora.

### 4. Solo el panel del precio

RSI (0-100) y MACD (con negativos) se quedan siempre en lineal.

## Implementación

### Backend

`api/dibujos.py` — columna nueva con el **mismo patrón de migración aditiva** ya
usado para `indicadores` (líneas 32-35):

```sql
ALTER TABLE dibujos ADD COLUMN escala TEXT NOT NULL DEFAULT 'lineal'
```

TEXT y no un booleano `es_log`: KLineChart trae de serie un tercer eje
(`percentage`); si algún día se quiere es un valor más, no una migración.
El `DEFAULT 'lineal'` deja las filas existentes abriéndose exactamente igual
que hoy.

`obtener()` devuelve `escala`; `guardar()` la recibe.

`api/main.py`:

```python
class DibujosEntrada(BaseModel):
    overlays: list[dict]
    indicadores: list[dict] = []
    escala: Literal["lineal", "log"] = "lineal"
```

`Literal` para que Pydantic rechace valores fuera de contrato antes de la BD.
El default mantiene compatible a un cliente que no mande el campo.

### Frontend

**Estado.** El botón vive en la barra superior (`Grafico.tsx`) pero la escala se
carga desde la API dentro de `GraficoVelas`, junto a dibujos e indicadores. Se
usa el patrón que ese componente ya aplica a `indicadoresAbierto`: `Grafico`
posee el estado, `GraficoVelas` lo sincroniza hacia arriba al cargar el análisis
(props `escala` / `onEscala`). Cero llamadas extra a la API. El remontado por
`key={simbolo}` ya existente hace que cambiar de símbolo traiga su escala.

**Aplicación.** En su propio efecto, nunca como dependencia del efecto de
arranque (deps `[simbolo, intervalo]`): ahí destruiría y recrearía el gráfico,
perdiendo zoom y overlays.

```tsx
useEffect(() => {
  chartRef.current?.overrideYAxis({
    paneId: "candle_pane",                                   // OBLIGATORIO
    name: escala === "log" ? "logarithm" : "normal",
  })
}, [escala])
```

`paneId` **no es decorativo**: `overrideYAxis` sin él resuelve el filtro a todos
los ejes de todos los paneles (verificado en `index.esm.js:15309`), y pondría
también RSI y MACD en logarítmico. Va comentado en el código.

Más un `escalaRef` para que el arranque aplique la escala vigente, igual que
`tipoRef` y `rejillaRef`.

**Fibonacci** (`fibonacci.ts`) — el precio manda y el eje lo sitúa:

```ts
const precioDe = (nivel: number) => valorFin + difValor * nivel
const yDe = (nivel: number) =>
  yAxis?.convertToPixel(precioDe(nivel)) ?? coordinates[1].y + difY * nivel
```

En lineal es matemáticamente idéntico a lo actual, así que **los fibos guardados
muestran los mismos números y en la misma posición que hoy**. Un fibo sobre el
panel del RSI recibe el `yAxis` de ese panel (lineal) y sale correcto sin rama
especial.

**UI.** Botón `LOG` en el grupo de tipo/rejilla, con el patrón de la rejilla
(`variant="default"` activo / `secondary` inactivo, `aria-pressed`, `title`).
Texto en vez de icono: ningún icono comunica "escala logarítmica" mejor que la
palabra, y TradingView también usa la palabra. En móvil, al grupo inferior.

## Riesgos declarados

1. **Espacio de coordenadas del eje.** Se asume que `convertToPixel` devuelve
   píxeles relativos al panel, igual que las `coordinates` del overlay. La
   prueba 1 lo detecta de inmediato: en lineal el fibo debe quedar donde está
   hoy.
2. **Redondeo en los extremos del fibo.** RESUELTO por el propio diseño: el
   nivel 0 evalúa a `valorFin` y el 1 a `valorInicio`, los valores exactos de
   los anclajes. Con la variante descartada (derivar el precio del píxel) sí
   aparecía un error sub-píxel medido de hasta 0,16 unidades.

## Fuera de alcance (YAGNI explícito)

Dibujos duplicados por escala · casilla log por fibo · eje `percentage` ·
log en paneles de indicadores · defensa para precios ≤ 0 · tocar KLineChart
(se usa su eje nativo; versión congelada y formato de overlays intactos).

## Verificación

`make lint` y `make build` limpios, y con Playwright contra dev:

| # | Prueba | Qué demuestra |
|---|---|---|
| 1 | Fibo en lineal: etiquetas antes vs. después | No-regresión + valida el espacio de coordenadas |
| 2 | `^GSPC` en 1S/1M → LOG | La curva se aplana; el eje deja de ser equidistante |
| 3 | Guardar → F5 | Persiste |
| 4 | Abrir BTCUSDT | Sigue en lineal: la escala no se contagia |
| 5 | Con RSI + MACD activos | Sus paneles siguen lineales |
| 6 | Fibo en log | Mismos precios que en lineal; líneas comprimidas hacia arriba |
| 7 | Símbolo con análisis antiguo | Abre en lineal, dibujos intactos |
| 8 | Consola | 0 errores |

`make -f Makefile.dev backup-prd` antes de desplegar.

## Ficheros

`api/dibujos.py` · `api/main.py` · `web/src/paginas/Grafico.tsx` ·
`web/src/components/GraficoVelas.tsx` · `web/src/lib/overlays/fibonacci.ts` ·
`CLAUDE.md` (la escala pasa a formar parte del contrato de persistencia).
