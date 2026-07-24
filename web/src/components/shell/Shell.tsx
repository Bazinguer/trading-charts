import { useEffect, useState } from "react"
import { ChartCandlestick, LayoutDashboard, LogOut, Moon, PanelLeft, Sun } from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useSesion } from "@/contextos/sesion"
import { useTema } from "@/contextos/tema"
import { cn } from "@/lib/utils"

function ItemNav({
  a,
  icono,
  etiqueta,
  plegado,
  alNavegar,
  activo,
}: {
  a: string
  icono: React.ReactNode
  etiqueta: string
  plegado: boolean
  alNavegar: () => void
  /** override del estado activo (para rutas con parámetro, p. ej. /grafico/:simbolo) */
  activo?: boolean
}) {
  return (
    <NavLink
      to={a}
      end={a === "/"}
      title={etiqueta}
      onClick={alNavegar}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[9px] px-3 py-2 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          (activo ?? isActive) && "bg-accent text-primary",
          plegado && "justify-center px-0",
        )
      }
    >
      {icono}
      {!plegado && <span>{etiqueta}</span>}
    </NavLink>
  )
}

export function Shell() {
  const { salir } = useSesion()
  const { claro, alternar } = useTema()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [plegado, setPlegado] = useState(
    () => localStorage.getItem("tc-sidebar-collapsed") === "1",
  )
  const [abiertoMovil, setAbiertoMovil] = useState(false)

  useEffect(() => {
    localStorage.setItem("tc-sidebar-collapsed", plegado ? "1" : "0")
  }, [plegado])

  const alternarSidebar = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setAbiertoMovil((a) => !a)
    else setPlegado((p) => !p)
  }

  const cerrarSesion = async () => {
    await salir()
    navegar("/login")
  }

  const ultimoSimbolo = localStorage.getItem("tc-ultimo-simbolo") ?? "BTCUSDT"

  return (
    <div>
      {/* Header a ancho completo, sobre el sidebar, sin línea inferior */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 bg-background px-4">
        <Button
          variant="outline"
          size="icon"
          onClick={alternarSidebar}
          aria-label="Plegar o desplegar el menú"
          className="rounded-[10px]"
        >
          <PanelLeft />
        </Button>
        <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-accent text-primary">
            <ChartCandlestick className="size-4" />
          </span>
          Trading Charts
        </span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={alternar}
          aria-label="Cambiar tema"
          className="text-muted-foreground"
        >
          {claro ? <Sun /> : <Moon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
          className="text-muted-foreground"
        >
          <LogOut />
        </Button>
      </header>

      <div className="flex items-start gap-5 px-4 pb-4 pt-2">
        {/* Overlay móvil */}
        {abiertoMovil && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setAbiertoMovil(false)}
          />
        )}

        {/* Sidebar flotante */}
        <aside
          className={cn(
            "z-40 flex flex-col gap-0.5 rounded-[14px] border bg-card p-2.5 transition-all",
            "fixed bottom-3 left-3 top-16 w-56 md:sticky md:top-16 md:bottom-auto md:h-[calc(100vh-4.5rem)]",
            abiertoMovil ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0",
            plegado && "md:w-[62px] md:p-2",
          )}
        >
          <ItemNav
            a="/"
            icono={<LayoutDashboard className="size-4 shrink-0" />}
            etiqueta="Inicio"
            plegado={plegado}
            alNavegar={() => setAbiertoMovil(false)}
          />
          <ItemNav
            a={`/grafico/${ultimoSimbolo}`}
            icono={<ChartCandlestick className="size-4 shrink-0" />}
            etiqueta="Gráfico"
            plegado={plegado}
            alNavegar={() => setAbiertoMovil(false)}
            activo={ubicacion.pathname.startsWith("/grafico/")}
          />
          <div className="mt-auto border-t pt-2.5 pb-1 text-center text-[11px] whitespace-nowrap text-faint">
            {plegado ? "v0.1" : "Trading Charts v0.1"}
          </div>
        </aside>

        {/* Contenido: pegado al sidebar (sin centrar), con tope de ancho en ultrapanorámicos */}
        <main className="min-w-0 flex-1">
          <div className="flex max-w-[1600px] flex-col gap-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
