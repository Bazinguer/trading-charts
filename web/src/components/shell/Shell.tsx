import { ChartCandlestick, LayoutDashboard, LogOut, Moon, Sun } from "lucide-react"
import type { ComponentType } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useSesion } from "@/contextos/sesion"
import { useTema } from "@/contextos/tema"
import { cn } from "@/lib/utils"

function ItemNav({
  a,
  etiqueta,
  icono: Icono,
  activo,
}: {
  a: string
  etiqueta: string
  icono: ComponentType<{ className?: string }>
  activo: boolean
}) {
  return (
    <Link
      to={a}
      className={cn(
        "flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[15px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        activo && "bg-accent text-primary",
      )}
    >
      <Icono className="h-[18px] w-[18px]" />
      {etiqueta}
    </Link>
  )
}

export function Shell() {
  const { salir } = useSesion()
  const { claro, alternar } = useTema()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  const cerrarSesion = async () => {
    await salir()
    navegar("/login")
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center bg-background px-4">
        <Link to="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-[9px] bg-accent text-primary">
            <ChartCandlestick className="size-[18px]" />
          </span>
          <span className="max-md:hidden">Trading Charts</span>
        </Link>

        {/* Navegación centrada respecto a la ventana, no al hueco restante.
            En móvil el centrado absoluto se solaparía con el logo: va en flujo. */}
        <nav className="ml-2 flex items-center gap-1 md:absolute md:left-1/2 md:ml-0 md:-translate-x-1/2">
          <ItemNav a="/" etiqueta="Inicio" icono={LayoutDashboard} activo={pathname === "/"} />
          <ItemNav
            a="/graficos"
            etiqueta="Gráficos"
            icono={ChartCandlestick}
            activo={pathname.startsWith("/grafico")}
          />
        </nav>

        <span className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={alternar}
          aria-label="Cambiar tema"
          className="text-muted-foreground"
        >
          {claro ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
          className="text-muted-foreground"
        >
          <LogOut className="size-5" />
        </Button>
      </header>

      <main
        className={cn(
          "flex flex-1 flex-col overflow-auto md:p-6",
          // La vista de gráfico cede el padding al lienzo en pantallas pequeñas
          pathname.startsWith("/grafico/") ? "p-2" : "p-4",
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
