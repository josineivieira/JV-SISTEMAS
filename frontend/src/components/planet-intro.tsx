'use client'

import { useEffect, useRef, useState } from 'react'

// Lightweight vector globe: no video, external requests, or 3D dependencies.
export default function PlanetIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 2600)
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setVisible(false) }
    window.addEventListener('keydown', escape)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', escape) }
  }, [])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const size = 520
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * ratio
    canvas.height = size * ratio
    context.scale(ratio, ratio)
    let frame = 0
    let animation = 0
    // Approximate continental silhouettes in longitude/latitude coordinates.
    const continents = [
      [[-166,68],[-130,73],[-60,50],[-82,10],[-115,30],[-140,58]],
      [[-80,10],[-48,-2],[-35,-10],[-68,-56],[-78,-20]],
      [[-18,35],[12,37],[50,10],[32,-35],[12,-35],[-16,10]],
      [[-10,36],[0,65],[60,73],[150,60],[170,48],[125,5],[95,6],[70,24],[40,35]],
      [[112,-12],[137,-10],[155,-25],[140,-40],[115,-32]],
      [[-52,60],[-22,70],[-35,83],[-60,80]],
    ]
    const onLand = (x: number, y: number) => continents.some(polygon => {
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
      }
      return inside
    })
    const points: {lat: number; lon: number; land: boolean}[] = []
    for (let lat = -84; lat < 85; lat += 4) {
      for (let lon = -180; lon < 180; lon += 4 / Math.cos(lat * Math.PI / 180)) {
        points.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180, land: onLand(lon, lat) })
      }
    }
    const draw = () => {
      context.clearRect(0, 0, size, size)
      const rotation = frame * 0.006 + 0.6
      const radius = 183
      const glow = context.createRadialGradient(260, 260, 140, 260, 260, 225)
      glow.addColorStop(0, '#159fff00'); glow.addColorStop(0.65, '#159fff0c'); glow.addColorStop(1, '#159fff00')
      context.fillStyle = glow; context.fillRect(0, 0, size, size)
      context.strokeStyle = '#159fff2a'; context.lineWidth = 0.7
      context.beginPath(); context.ellipse(260,260,230,65,-0.38,0,Math.PI*2); context.stroke()
      for (const point of points) {
        const z = Math.cos(point.lat) * Math.cos(point.lon + rotation)
        if (z < 0) continue
        const x = Math.cos(point.lat) * Math.sin(point.lon + rotation)
        const y = Math.sin(point.lat)
        context.fillStyle = point.land ? `rgba(21,159,255,${0.3 + z * 0.7})` : `rgba(73,142,201,${0.06 + z * 0.14})`
        context.beginPath(); context.arc(260 + x * radius, 260 - y * radius, point.land ? 1.65 : 0.65, 0, Math.PI * 2); context.fill()
      }
      context.strokeStyle = '#159fff40'; context.beginPath(); context.arc(260,260,radius,0,Math.PI*2); context.stroke()
      frame++; animation = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animation)
  }, [visible])

  if (!visible) return null
  return <div className="jv-intro-overlay" role="region" aria-label="Abertura JV Sistemas">
    <button type="button" className="jv-intro-skip" onClick={() => setVisible(false)}>Pular abertura ↗</button>
    <div className="jv-intro-content"><span className="jv-intro-caption">TECNOLOGIA QUE CONECTA POSSIBILIDADES</span>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="jv-intro-brand"><img src="/jv-sistemas-mark-transparent.png" alt="" /><span>JV SISTEMAS<small>& TECNOLOGIA</small></span></div>
      <p>MANAUS · PORTO ALEGRE · BRASIL</p><div className="jv-intro-progress" aria-hidden="true"><span /></div>
    </div>
  </div>
}
