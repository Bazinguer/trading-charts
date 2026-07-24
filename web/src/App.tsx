import { useState } from 'react'
import { Grafico } from './Grafico'

const SIMBOLOS = ['BTCUSDT', 'ETHUSDT']

export default function App() {
  const [simbolo, setSimbolo] = useState('BTCUSDT')
  const [intervalo, setIntervalo] = useState<'1d' | '1w'>('1d')

  return (
    <main>
      <header>
        <h1>charts</h1>
        <select value={simbolo} onChange={(e) => setSimbolo(e.target.value)}>
          {SIMBOLOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="intervalos">
          <button className={intervalo === '1d' ? 'activo' : ''} onClick={() => setIntervalo('1d')}>
            1D
          </button>
          <button className={intervalo === '1w' ? 'activo' : ''} onClick={() => setIntervalo('1w')}>
            1S
          </button>
        </div>
      </header>
      <Grafico simbolo={simbolo} intervalo={intervalo} />
    </main>
  )
}
