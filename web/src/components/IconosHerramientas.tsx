import type { SVGProps } from "react"

// Iconos propios de la barra de dibujo, estilo Investing/TradingView: trazo
// fino con nodos circulares en las anclas. Mismo contrato que un icono lucide
// (stroke currentColor, viewBox 24, escalan con [&_svg]:size-* del Button).

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  )
}

export function IconoLinea(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <circle cx="5.5" cy="18.5" r="1.8" />
      <circle cx="18.5" cy="5.5" r="1.8" />
    </Svg>
  )
}

export function IconoHorizontal(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="3" y1="12" x2="9.5" y2="12" />
      <line x1="14.5" y1="12" x2="21" y2="12" />
      <circle cx="12" cy="12" r="1.8" />
    </Svg>
  )
}

export function IconoVertical(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="12" y1="3" x2="12" y2="9.5" />
      <line x1="12" y1="14.5" x2="12" y2="21" />
      <circle cx="12" cy="12" r="1.8" />
    </Svg>
  )
}

export function IconoCanal(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="4" y1="15" x2="14" y2="5" />
      <line x1="10" y1="19" x2="20" y2="9" />
      <circle cx="15.5" cy="3.5" r="1.6" />
      <circle cx="8.5" cy="20.5" r="1.6" />
    </Svg>
  )
}

export function IconoFibonacci(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="4" y1="6" x2="17" y2="6" />
      <line x1="4" y1="12" x2="17" y2="12" />
      <line x1="4" y1="18" x2="17" y2="18" />
      <circle cx="19.5" cy="6" r="1.6" />
      <circle cx="19.5" cy="12" r="1.6" />
      <circle cx="19.5" cy="18" r="1.6" />
    </Svg>
  )
}

export function IconoFormas(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" />
      <circle cx="5.5" cy="5.5" r="1.8" />
      <circle cx="18.5" cy="18.5" r="1.8" />
    </Svg>
  )
}

export function IconoTexto(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="6" y1="5" x2="18" y2="5" />
      <line x1="6" y1="5" x2="6" y2="7.5" />
      <line x1="18" y1="5" x2="18" y2="7.5" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="9.5" y1="19" x2="14.5" y2="19" />
    </Svg>
  )
}

export function IconoPincel(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M5 14c3-6 7-6 9-3s4 3 5 1" />
      <circle cx="5" cy="16.5" r="1.8" />
      <path d="M13.5 19.5c1.5 0 2.5-1 2.5-2.2 0-1-.8-1.8-1.9-1.8-.9 0-1.6.6-1.6 1.5 0 1.4 1 2.5 1 2.5z" />
    </Svg>
  )
}

export function IconoRegla(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="2.8" y="9.5" width="18.4" height="5" rx="1" transform="rotate(-45 12 12)" />
      <line x1="8.5" y1="12" x2="10" y2="13.5" />
      <line x1="11.5" y1="9" x2="13" y2="10.5" />
      <line x1="14.5" y1="6" x2="16" y2="7.5" />
    </Svg>
  )
}
