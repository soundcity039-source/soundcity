import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// ─── Crop constants ────────────────────────────────────────
const CONTAINER = 240   // square container px (must match CSS)
const CROP_D    = 200   // circle diameter px (must match CSS)

// ─── CropModal ─────────────────────────────────────────────
function CropModal({ file, onConfirm, onCancel }) {
  const containerRef = useRef(null)
  const imgRef       = useRef(null)
  const objUrl       = useRef(URL.createObjectURL(file))
  const nw           = useRef(1)
  const nh           = useRef(1)
  const fitScale     = useRef(1)
  const x            = useRef(0)
  const y            = useRef(0)
  const userScale    = useRef(1)
  const touch        = useRef(null)
  const mouse        = useRef(null)
  const [tick, setTick] = useState(0)

  useEffect(() => () => URL.revokeObjectURL(objUrl.current), [])

  function onLoad(e) {
    nw.current = e.target.naturalWidth
    nh.current = e.target.naturalHeight
    fitScale.current = CROP_D / Math.min(nw.current, nh.current)
    userScale.current = 1
    x.current = 0
    y.current = 0
    setTick(t => t + 1)
  }

  // ── touch / mouse handlers (only read refs, safe to capture once) ──
  function handleTouchStart(e) {
    e.preventDefault()
    if (e.touches.length === 1) {
      touch.current = { type: 'pan', sx: e.touches[0].clientX, sy: e.touches[0].clientY, bx: x.current, by: y.current }
    } else if (e.touches.length >= 2) {
      const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)
      touch.current = { type: 'pinch', startDist: d, baseScale: userScale.current }
    }
  }
  function handleTouchMove(e) {
    e.preventDefault()
    const t = touch.current
    if (!t) return
    if (t.type === 'pan' && e.touches.length === 1) {
      x.current = t.bx + (e.touches[0].clientX - t.sx)
      y.current = t.by + (e.touches[0].clientY - t.sy)
      setTick(n => n + 1)
    } else if (t.type === 'pinch' && e.touches.length >= 2) {
      const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)
      userScale.current = Math.max(0.5, Math.min(8, t.baseScale * (d / t.startDist)))
      setTick(n => n + 1)
    }
  }
  function handleTouchEnd() { touch.current = null }
  function handleWheel(e) {
    e.preventDefault()
    userScale.current = Math.max(0.5, Math.min(8, userScale.current * (e.deltaY > 0 ? 0.9 : 1.1)))
    setTick(n => n + 1)
  }

  // Attach touch/wheel with { passive: false } imperatively
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart',  handleTouchStart, { passive: false })
    el.addEventListener('touchmove',   handleTouchMove,  { passive: false })
    el.addEventListener('touchend',    handleTouchEnd)
    el.addEventListener('wheel',       handleWheel,      { passive: false })
    return () => {
      el.removeEventListener('touchstart',  handleTouchStart)
      el.removeEventListener('touchmove',   handleTouchMove)
      el.removeEventListener('touchend',    handleTouchEnd)
      el.removeEventListener('wheel',       handleWheel)
    }
  }, []) // eslint-disable-line

  function onMouseDown(e) {
    mouse.current = { sx: e.clientX, sy: e.clientY, bx: x.current, by: y.current }
  }
  function onMouseMove(e) {
    if (!mouse.current) return
    x.current = mouse.current.bx + (e.clientX - mouse.current.sx)
    y.current = mouse.current.by + (e.clientY - mouse.current.sy)
    setTick(n => n + 1)
  }
  function onMouseUp() { mouse.current = null }

  // ── confirm: crop to canvas blob ──
  async function handleConfirm() {
    const totalScale = fitScale.current * userScale.current
    const OUT = 300
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2)
    ctx.clip()

    const dispW   = nw.current * totalScale
    const dispH   = nh.current * totalScale
    const imgLeft = CONTAINER / 2 + x.current - dispW / 2
    const imgTop  = CONTAINER / 2 + y.current - dispH / 2
    const cropL   = (CONTAINER - CROP_D) / 2
    const cropT   = (CONTAINER - CROP_D) / 2
    const srcX    = (cropL - imgLeft) / totalScale
    const srcY    = (cropT - imgTop)  / totalScale
    const srcSize = CROP_D / totalScale

    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUT, OUT)
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.75)
  }

  const totalScale = fitScale.current * userScale.current
  const imgStyle = {
    position: 'absolute',
    left: CONTAINER / 2 - nw.current / 2,
    top:  CONTAINER / 2 - nh.current / 2,
    width:  nw.current,
    height: nh.current,
    transform: `translate(${x.current}px, ${y.current}px) scale(${totalScale})`,
    transformOrigin: `${nw.current / 2}px ${nh.current / 2}px`,
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    draggable: 'false',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px', boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '20px 16px',
        width: '100%', maxWidth: 320, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>写真を調整</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>ドラッグで移動・ピンチ/スクロールで拡大縮小</div>

        {/* Crop viewport */}
        <div
          ref={containerRef}
          style={{
            width: CONTAINER, height: CONTAINER,
            position: 'relative', overflow: 'hidden',
            background: '#111', borderRadius: 8,
            cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <img ref={imgRef} src={objUrl.current} onLoad={onLoad} style={imgStyle} alt="" />

          {/* Dark overlay with circular cutout */}
          <div style={{
            position: 'absolute',
            top:  (CONTAINER - CROP_D) / 2,
            left: (CONTAINER - CROP_D) / 2,
            width: CROP_D, height: CROP_D,
            borderRadius: '50%',
            boxShadow: '0 0 0 600px rgba(0,0,0,0.55)',
            border: '2px solid rgba(255,255,255,0.85)',
            pointerEvents: 'none',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#475569', fontWeight: 700 }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            style={{ flex: 2, padding: '11px', background: '#06C755', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 800 }}
          >
            この位置で切り取る
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────
const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  avatar: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', background: '#eee' },
  placeholder: {
    width: 80, height: 80, borderRadius: '50%', background: '#e6f9ed',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
  },
  btn: {
    padding: '6px 16px', background: '#06C755', color: '#fff',
    border: 'none', borderRadius: 20, fontSize: 13, cursor: 'pointer',
  },
}

// ─── PhotoUpload ───────────────────────────────────────────
export default function PhotoUpload({ currentUrl, onUpload, memberId }) {
  const [uploading, setUploading] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCropFile(file)
  }

  async function handleCropConfirm(blob) {
    setCropFile(null)
    setUploading(true)
    try {
      const path = `${memberId || 'tmp'}_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/jpeg', upsert: true,
      })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      onUpload(publicUrl)
    } catch (err) {
      alert('写真のアップロードに失敗しました')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={s.wrap}>
      {cropFile && (
        <CropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
      {currentUrl
        ? <img src={currentUrl} alt="" style={s.avatar} />
        : <div style={s.placeholder}>🎵</div>
      }
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <button style={s.btn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? 'アップロード中...' : '写真を選択'}
      </button>
    </div>
  )
}
