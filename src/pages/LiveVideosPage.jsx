import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLiveVideos } from '../api.js'

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
  return m ? m[1] : null
}

// ライブ名から背景グラデーションを決める（色のバリエーション）
const LIVE_COLORS = [
  'linear-gradient(135deg,#1e293b,#0f172a)',
  'linear-gradient(135deg,#312e81,#1e1b4b)',
  'linear-gradient(135deg,#164e63,#0c4a6e)',
  'linear-gradient(135deg,#3b0764,#1e1b4b)',
  'linear-gradient(135deg,#14532d,#052e16)',
  'linear-gradient(135deg,#7c2d12,#431407)',
]

export default function LiveVideosPage() {
  const navigate = useNavigate()
  const [videos, setVideos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('lives')   // 'lives' | 'days' | 'plans'
  const [selLive, setSelLive] = useState(null)
  const [selDay, setSelDay]   = useState(null)

  useEffect(() => {
    getLiveVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function goBack() {
    if (view === 'plans')      { setView('days');  setSelDay(null) }
    else if (view === 'days')  { setView('lives'); setSelLive(null) }
    else                       { navigate(-1) }
  }

  // ユニークなライブ名一覧（display_order → created_at でソート）
  const liveNames = [...new Set(
    videos
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.created_at?.localeCompare(b.created_at))
      .map(v => v.live_name)
  )]

  // 選択中ライブで存在する日程
  const daysForLive = selLive
    ? [...new Set(videos.filter(v => v.live_name === selLive).map(v => v.day))].sort()
    : []

  // 選択中ライブ×日程の動画
  const plansForDay = (selLive && selDay != null)
    ? videos
        .filter(v => v.live_name === selLive && v.day === selDay)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : []

  // ヘッダータイトル
  const headerTitle = view === 'plans'
    ? `${selLive} › ${selDay}日目`
    : view === 'days'
    ? selLive
    : '過去ライブ動画'

  const headerSub = view === 'lives' ? 'SOUND CITY アーカイブ' : null

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
        padding: '16px 20px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        minHeight: 70,
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 120, height: 120,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }}/>
        <button style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
        }} onClick={goBack}>←</button>
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {headerTitle}
          </div>
          {headerSub && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{headerSub}</div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 60 }}>読み込み中...</div>
      )}

      {/* ── Level 1: ライブ一覧 ── */}
      {!loading && view === 'lives' && (
        <div style={{ padding: '16px 14px 0' }}>
          {liveNames.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              動画はまだ登録されていません
            </div>
          )}
          {liveNames.map((liveName, idx) => {
            const liveVideos = videos.filter(v => v.live_name === liveName)
            const days  = [...new Set(liveVideos.map(v => v.day))].sort()
            const total = liveVideos.length
            const thumbId = getYouTubeId(liveVideos[0]?.youtube_url)
            const bg = LIVE_COLORS[idx % LIVE_COLORS.length]

            return (
              <button key={liveName} className="menu-card" onClick={() => { setSelLive(liveName); setView('days') }}
                style={{
                  width: '100%', marginBottom: 14, border: 'none', cursor: 'pointer',
                  background: bg,
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'stretch', minHeight: 88, textAlign: 'left',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                {/* Thumbnail strip */}
                {thumbId && (
                  <div style={{ width: 100, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(0,0,0,0.3))' }}/>
                  </div>
                )}
                {/* Info */}
                <div style={{ padding: '16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{liveName}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {days.map(d => (
                      <span key={d} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                      }}>{d}日目</span>
                    ))}
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                    }}>{total}企画</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Level 2: 日程選択 ── */}
      {!loading && view === 'days' && (
        <div style={{ padding: '24px 14px 0' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16, paddingLeft: 4 }}>
            日程を選択
          </div>
          {daysForLive.map(day => {
            const cnt = videos.filter(v => v.live_name === selLive && v.day === day).length
            const thumbId = getYouTubeId(
              videos.find(v => v.live_name === selLive && v.day === day)?.youtube_url
            )
            return (
              <button key={day} className="menu-card" onClick={() => { setSelDay(day); setView('plans') }}
                style={{
                  width: '100%', marginBottom: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#1e293b,#0f172a)',
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'stretch', minHeight: 80, textAlign: 'left',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                {thumbId && (
                  <div style={{ width: 90, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}/>
                  </div>
                )}
                <div style={{ padding: '16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{day}日目</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{cnt}企画</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Level 3: 企画一覧（動画）── */}
      {!loading && view === 'plans' && (
        <div style={{ padding: '16px 14px 0' }}>
          {plansForDay.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>動画がありません</div>
          )}
          {plansForDay.map(video => {
            const videoId = getYouTubeId(video.youtube_url)
            return (
              <div key={video.video_id} style={{
                background: '#1e293b', borderRadius: 16, marginBottom: 20,
                overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {videoId ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title={video.plan_name}
                    />
                  </div>
                ) : (
                  <div style={{ paddingBottom: '56.25%', position: 'relative', background: '#0f172a' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>URLが無効です</div>
                  </div>
                )}
                <div style={{ padding: '12px 16px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{video.plan_name}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
