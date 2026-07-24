import { useEffect, useState } from "react"
import { ChartCandlestick } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AnalisisGuardado } from "@/lib/api"
import { fechaHora } from "@/lib/formato"

export function Graficos() {
  const navegar = useNavigate()
  const [analisis, setAnalisis] = useState<AnalisisGuardado[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    api<AnalisisGuardado[]>("/api/analisis")
      .then((datos) => {
        if (!cancelado) setAnalisis(datos)
      })
      .catch(() => {
        if (!cancelado) {
          setError("No se pudieron cargar los análisis")
          setAnalisis([])
        }
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Análisis técnico guardados"
        description="Símbolos con dibujos persistidos: vuelve meses después y compara la previsión con la realidad"
        icon={<ChartCandlestick className="size-5" />}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {analisis === null ? (
        <Skeleton className="h-48 w-full rounded-[14px]" />
      ) : analisis.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-[14px] border bg-card p-10 text-center">
          <p className="text-muted-foreground">Aún no hay análisis guardados</p>
          <p className="text-xs text-faint">
            Abre un gráfico desde una lista, dibuja y pulsa «Guardar»
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] border bg-card p-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Símbolo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Dibujos</TableHead>
                <TableHead className="text-right">Última modificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analisis.map((a) => (
                <TableRow
                  key={a.simbolo}
                  className="cursor-pointer"
                  onClick={() =>
                    navegar(`/grafico/${encodeURIComponent(a.simbolo)}`, {
                      state: { from: "/graficos" },
                    })
                  }
                >
                  <TableCell className="font-medium">{a.simbolo}</TableCell>
                  <TableCell className="text-muted-foreground">{a.nombre ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.dibujos}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fechaHora(a.actualizado)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
