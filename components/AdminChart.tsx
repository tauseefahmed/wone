"use client"

import React from "react"

export type ChartType = "line" | "bar"

type DataPoint = { label: string; value: number }

export default function AdminChart({
  type = "line",
  data,
  height = 180,
  stroke = "var(--admin-secondary)",
  fill = "rgba(74,144,226,0.18)",
}: {
  type?: ChartType
  data: DataPoint[]
  height?: number
  stroke?: string
  fill?: string
}) {
  const width = 480
  const padding = 24
  const max = Math.max(...data.map((d) => d.value), 1)
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1)

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - (d.value / max) * (height - padding * 2)
    return { x, y }
  })

  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ")

  const areaPath = `M ${points[0]?.x ?? 0},${height - padding} ${points
    .map((p) => `L ${p.x},${p.y}`)
    .join(" ")} L ${points[points.length - 1]?.x ?? 0},${height - padding} Z`

  return (
    <div className="chart-card">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {/* grid */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = padding + (i * (height - padding * 2)) / 4
          return <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eee" />
        })}

        {type === "line" && (
          <>
            <path d={areaPath} fill={fill} />
            <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
            ))}
          </>
        )}

        {type === "bar" && (
          <>
            {data.map((d, i) => {
              const barWidth = stepX * 0.6
              const x = padding + i * stepX - barWidth / 2
              const barHeight = (d.value / max) * (height - padding * 2)
              const y = height - padding - barHeight
              return <rect key={i} x={x} y={y} width={barWidth} height={barHeight} fill={stroke} opacity={0.85} rx={6} />
            })}
          </>
        )}

        {/* labels */}
        {data.map((d, i) => {
          const x = padding + i * stepX
          return (
            <text key={i} x={x} y={height - 6} fontSize={10} textAnchor="middle" fill="#999">
              {d.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
