import { useState, useRef, useEffect } from 'react'
import { Point, DataPoint, Regression, Line, StateType, ST } from '@/lib/types'

export function useDigitizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [state, setState] = useState<StateType>(ST.UPLOAD)
  const [pX1, setPX1] = useState<Point | null>(null)
  const [pX2, setPX2] = useState<Point | null>(null)
  const [pY1, setPY1] = useState<Point | null>(null)
  const [pY2, setPY2] = useState<Point | null>(null)
  const [lines, setLines] = useState<Line[]>([{ id: 1, name: 'Line 1', points: [], regression: null, color: '#ff0000' }])
  const [currentLineId, setCurrentLineId] = useState<number>(1)
  const [vX1, setVX1] = useState<number>(0)
  const [vX2, setVX2] = useState<number>(100)
  const [vY1, setVY1] = useState<number>(20)
  const [vY2, setVY2] = useState<number>(90)
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [offsetX, setOffsetX] = useState<number>(0)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [scaledWidth, setScaledWidth] = useState<number>(0)
  const [scaledHeight, setScaledHeight] = useState<number>(0)
  const [showRedDot, setShowRedDot] = useState<boolean>(false)

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const image = new Image()
        image.onload = () => {
          setImg(image)
          resetApp()
          setState(ST.SET_X1)
          playBeep()
        }
        image.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const resetApp = () => {
    setPX1(null)
    setPX2(null)
    setPY1(null)
    setPY2(null)
    setLines([{ id: 1, name: 'Line 1', points: [], regression: null, color: '#ff0000' }])
    setCurrentLineId(1)
    setOffsetX(0)
    setOffsetY(0)
    setScaledWidth(0)
    setScaledHeight(0)
    setState(img ? ST.SET_X1 : ST.UPLOAD)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state === ST.UPLOAD || !img) return

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    if (clickX < offsetX || clickX > offsetX + scaledWidth || clickY < offsetY || clickY > offsetY + scaledHeight) return
    const x = (clickX - offsetX) * (img.width / scaledWidth)
    const y = (clickY - offsetY) * (img.height / scaledHeight)

    switch (state) {
      case ST.SET_X1: setPX1({ x, y }); setState(ST.SET_X2); setShowRedDot(true); setTimeout(() => setShowRedDot(false), 7000); playBeep(); break
      case ST.SET_X2: setPX2({ x, y }); setState(ST.SET_Y1); setShowRedDot(true); setTimeout(() => setShowRedDot(false), 7000); playBeep(); break
      case ST.SET_Y1: setPY1({ x, y }); setState(ST.SET_Y2); setShowRedDot(true); setTimeout(() => setShowRedDot(false), 7000); playBeep(); break
      case ST.SET_Y2: setPY2({ x, y }); setState(ST.COLLECT); setShowRedDot(true); setTimeout(() => setShowRedDot(false), 7000); playBeep(); break
      case ST.COLLECT: addPoint(x, y); break
    }
  }

  const addPoint = (x: number, y: number) => {
    const calcX = getProjectedValue({ x, y }, pX1, pX2, vX1, vX2)
    const calcY = getProjectedValue({ x, y }, pY1, pY2, vY1, vY2)
    const currentLine = lines.find(l => l.id === currentLineId)
    if (!currentLine) return
    const newPoint: DataPoint = {
      id: currentLine.points.length + 1,
      px: { x, y },
      val: { x: calcX, y: calcY }
    }
    setLines(prev => prev.map(l => l.id === currentLineId ? { ...l, points: [...l.points, newPoint], regression: null } : l))
  }

  const getProjectedValue = (clickPt: Point, refP1: Point | null, refP2: Point | null, val1: number, val2: number): number => {
    if (!refP1 || !refP2) return val1
    const vAxis = { x: refP2.x - refP1.x, y: refP2.y - refP1.y }
    const vClick = { x: clickPt.x - refP1.x, y: clickPt.y - refP1.y }
    const axisLenSq = vAxis.x * vAxis.x + vAxis.y * vAxis.y
    if (axisLenSq === 0) return val1
    const dotProduct = vClick.x * vAxis.x + vClick.y * vAxis.y
    const t = dotProduct / axisLenSq
    return val1 + t * (val2 - val1)
  }

  const calculateRegression = () => {
    const currentLine = lines.find(l => l.id === currentLineId)
    if (!currentLine || currentLine.points.length < 2) {
      alert("Missing points in current line")
      return
    }
    const dataPoints = currentLine.points
    let n = dataPoints.length
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0
    dataPoints.forEach(p => {
      sumX += p.val.x; sumY += p.val.y
      sumXY += p.val.x * p.val.y
      sumXX += p.val.x * p.val.x
      sumYY += p.val.y * p.val.y
    })
    const mX = sumX / n, mY = sumY / n
    const ssXX = sumXX - n * mX * mX
    const ssXY = sumXY - n * mX * mY
    const ssYY = sumYY - n * mY * mY
    const slope = ssXY / ssXX
    const intercept = mY - slope * mX
    const r2 = Math.pow(ssXY / Math.sqrt(ssXX * ssYY), 2)
    const reg: Regression = { slope, intercept, r2 }
    setLines(prev => prev.map(l => l.id === currentLineId ? { ...l, regression: reg } : l))
  }

  const valToPx = (valX: number, valY: number): Point | null => {
    if (!pX1 || !pX2 || !pY1 || !pY2) return null
    const UX = { x: pX2.x - pX1.x, y: pX2.y - pX1.y }
    const UY = { x: pY2.x - pY1.x, y: pY2.y - pY1.y }
    const tX = (valX - vX1) / (vX2 - vX1)
    const tY = (valY - vY1) / (vY2 - vY1)
    const K1 = tX * (UX.x * UX.x + UX.y * UX.y) + pX1.x * UX.x + pX1.y * UX.y
    const K2 = tY * (UY.x * UY.x + UY.y * UY.y) + pY1.x * UY.x + pY1.y * UY.y
    const det = UX.x * UY.y - UX.y * UY.x
    if (Math.abs(det) < 1e-5) return null
    const x = (K1 * UY.y - K2 * UX.y) / det
    const y = (UX.x * K2 - UY.x * K1) / det
    return { x, y }
  }

  const draw = (ox: number, oy: number, sw: number, sh: number) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, ox, oy, sw, sh)

    const markers = [
      { p: pX1, c: '#0056b3', l: 'X1' }, { p: pX2, c: '#00aaff', l: 'X2' },
      { p: pY1, c: '#1e7e34', l: 'Y1' }, { p: pY2, c: '#28a745', l: 'Y2' }
    ]

    if (pX1 && pX2) {
      const x1 = ox + (pX1.x / img.width) * sw
      const y1 = oy + (pX1.y / img.height) * sh
      const x2 = ox + (pX2.x / img.width) * sw
      const y2 = oy + (pX2.y / img.height) * sh
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(0,123,255,0.6)'; ctx.lineWidth = 2; ctx.stroke()
    }
    if (pY1 && pY2) {
      const x1 = ox + (pY1.x / img.width) * sw
      const y1 = oy + (pY1.y / img.height) * sh
      const x2 = ox + (pY2.x / img.width) * sw
      const y2 = oy + (pY2.y / img.height) * sh
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(40,167,69,0.6)'; ctx.lineWidth = 2; ctx.stroke()
    }

    markers.forEach(m => {
      if (m.p) {
        const cx = ox + (m.p.x / img.width) * sw
        const cy = oy + (m.p.y / img.height) * sh
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2)
        ctx.fillStyle = m.c; ctx.fill(); ctx.strokeStyle = 'white'; ctx.stroke()
        ctx.fillStyle = 'black'; ctx.font = 'bold 12px sans-serif'
        ctx.fillText(m.l, cx + 8, cy - 8)
      }
    })

    lines.forEach(line => {
      line.points.forEach(pt => {
        const cx = ox + (pt.px.x / img.width) * sw
        const cy = oy + (pt.px.y / img.height) * sh
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2)
        ctx.fillStyle = line.color; ctx.fill()
        ctx.strokeStyle = 'black'; ctx.lineWidth = 1; ctx.stroke()
      })

      if (line.regression) {
        const minX = Math.min(...line.points.map(d => d.val.x))
        const maxX = Math.max(...line.points.map(d => d.val.x))
        const startY = line.regression.slope * minX + line.regression.intercept
        const endY = line.regression.slope * maxX + line.regression.intercept
        const pxStart = valToPx(minX, startY)
        const pxEnd = valToPx(maxX, endY)
        if (pxStart && pxEnd) {
          const sx = ox + (pxStart.x / img.width) * sw
          const sy = oy + (pxStart.y / img.height) * sh
          const ex = ox + (pxEnd.x / img.width) * sw
          const ey = oy + (pxEnd.y / img.height) * sh
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey)
          ctx.strokeStyle = line.color; ctx.lineWidth = 4; ctx.setLineDash([5, 5]); ctx.stroke()
          ctx.setLineDash([])
        }
      }
    })
  }

  useEffect(() => {
    if (img && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const availableWidth = container.clientWidth - 40;
      const availableHeight = container.clientHeight - 40;
      let scale;
      scale = availableHeight / img.height;
      const sw = img.width * scale;
      const sh = img.height * scale;
      const ox = (availableWidth - sw) / 2;
      const oy = (availableHeight - sh) / 2;
      setScaledWidth(sw);
      setScaledHeight(sh);
      setOffsetX(ox);
      setOffsetY(oy);
      canvas.width = availableWidth;
      canvas.height = availableHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
  }, [img, pX1, pX2, pY1, pY2, lines])

  useEffect(() => {
    draw(offsetX, offsetY, scaledWidth, scaledHeight)
  }, [img, pX1, pX2, pY1, pY2, lines, offsetX, offsetY, scaledWidth, scaledHeight])

  const exportCSV = () => {
    // Sort points by x for each line
    const sortedLines = lines.map(line => ({
      ...line,
      points: [...line.points].sort((a, b) => a.val.x - b.val.x)
    }))
    const maxPoints = Math.max(...sortedLines.map(l => l.points.length))
    const headers: string[] = []
    for (let i = 1; i <= sortedLines.length; i++) {
      headers.push(`X${i}`, `Y${i}`)
    }
    const rows: string[] = []
    for (let p = 0; p < maxPoints; p++) {
      const row: string[] = []
      sortedLines.forEach(line => {
        const point = line.points[p]
        row.push(point ? point.val.x.toFixed(4) : '', point ? point.val.y.toFixed(4) : '')
      })
      rows.push(row.join(','))
    }
    const csv = headers.join(',') + '\n' + rows.join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'data.csv'
    a.click()
  }

  const addLine = () => {
    const newId = Math.max(...lines.map(l => l.id)) + 1
    const colors = ['#ff0000', '#228b22', '#0000ff', '#daa520', '#8a2be2', '#00ced1']
    const color = colors[lines.length % colors.length]
    setLines(prev => [...prev, { id: newId, name: `Line ${newId}`, points: [], regression: null, color }])
    setCurrentLineId(newId)
  }

  const selectLine = (id: number) => {
    setCurrentLineId(id)
  }

  const delPoint = (id: number) => {
    setLines(lines.map(line =>
      line.id === currentLineId ? { ...line, points: line.points.filter(p => p.id !== id) } : line
    ))
  }

  return {
    canvasRef,
    inputRef,
    containerRef,
    img,
    state,
    lines,
    currentLineId,
    vX1,
    vX2,
    vY1,
    vY2,
    openDialog,
    showRedDot,
    setVX1,
    setVX2,
    setVY1,
    setVY2,
    handleImageUpload,
    resetApp,
    handleCanvasClick,
    calculateRegression,
    exportCSV,
    addLine,
    selectLine,
    delPoint,
    setOpenDialog
  }
}
