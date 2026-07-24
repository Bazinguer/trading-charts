import { useEffect, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"

import { GraficoVelas } from "@/components/GraficoVelas"
import { Button } from "@/components/ui/button"
import { api, type ResumenSimbolo } from "@/lib/api"

export function Grafico() {
  const { simbolo = "BTCUSDT" } = useParams()
  const { state } = useLocation()
  const [intervalo, setIntervalo] = useState<"1d" | "1w">("1d")
  const [nombre, setNombre] = useState<string | null>(null)

  const volverA = (state as { from?: string } | null)?.from ?? "/graficos"
  // Patrón DS: el back link nombra el DESTINO, nunca un genérico "Volver".
  const etiquetaVolver = volverA === "/" ? "Inicio" : "Gráficos"

  // Nombre del activo para el título; sin él la página funciona igual.
  useEffect(() => {
    let cancelado = false
    setNombre(null)
    api<ResumenSimbolo[]>(`/api/resumen?simbolos=${encodeURIComponent(simbolo)}`)
      .then((r) => {
        if (!cancelado) setNombre(r[0]?.nombre ?? null)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [simbolo])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Link
        to={volverA}
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {etiquetaVolver}
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">
          {simbolo}
          {nombre && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{nombre}</span>
          )}
        </h1>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={intervalo === "1d" ? "default" : "secondary"}
            onClick={() => setIntervalo("1d")}
          >
            1D
          </Button>
          <Button
            size="sm"
            variant={intervalo === "1w" ? "default" : "secondary"}
            onClick={() => setIntervalo("1w")}
          >
            1S
          </Button>
        </div>
      </div>
      <GraficoVelas simbolo={simbolo} intervalo={intervalo} />
    </div>
  )
}
