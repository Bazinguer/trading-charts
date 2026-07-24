import { ChartCandlestick, LogOut, Moon, Sun } from "lucide-react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useSesion } from "@/contextos/sesion"
import { useTema } from "@/contextos/tema"
import { cn } from "@/lib/utils"

function ItemNav({ a, etiqueta, activo }: { a: string; etiqueta: string; activo: boolean }) {
  return (
    <Link
      to={a}
      className={cn(
        "rounded-[9px] px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        activo && "bg-accent text-primary",
      )}
    >
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
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background px-4">
        <Link to="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-accent text-primary">
            <ChartCandlestick className="size-4" />
          </span>
          Trading Charts
        </Link>

        {/* Navegación centrada respecto a la ventana, no al hueco restante */}
        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          <ItemNav a="/" etiqueta="Inicio" activo={pathname === "/"} />
          <ItemNav
            a="/graficos"
            etiqueta="Gráficos"
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

      <main className="flex flex-1 flex-col overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
