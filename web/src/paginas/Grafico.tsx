import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { GraficoVelas } from "@/components/GraficoVelas"
import { Button } from "@/components/ui/button"

export function Grafico() {
  const { simbolo = "BTCUSDT" } = useParams()
  const [intervalo, setIntervalo] = useState<"1d" | "1w">("1d")

  // Último símbolo visto: destino del ítem "Gráfico" del sidebar.
  useEffect(() => {
    localStorage.setItem("tc-ultimo-simbolo", simbolo)
  }, [simbolo])

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{simbolo}</h1>
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
