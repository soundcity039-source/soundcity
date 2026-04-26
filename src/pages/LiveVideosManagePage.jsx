import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLiveVideos, createLiveVideo, updateLiveVideo, deleteLiveVideo } from '../api.js'

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
  return m ? m[1] : null
}

const EMPTY = { live_name: '', day: 1, plan_name: '', youtube_url: '', display_order: '' }

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
    color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30, width: 120, height: 120,
    borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  addBtn: {
    width: '100%', padding: '12px', background: '#1e293b', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16,
  },
  // Level cards
  liveCard: {
    background: 'var(--card-bg)', borderRadius: 14, marginBottom: 10,
    boxShadow: 'var(--card-shadow)', overflow: 'hidden',
    display: 'flex', alignItems: 'center', padding: '14px 16px',
    cursor: 'pointer', border: '1px solid var(--card-border)', width: '100%', textAlign: 'left', gap: 12,
  },
  liveCardTitle: { fontSize: 15, fontWeight: 800, color: 'var(--text)', flex: 1 },
  liveCardSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  dayCard: {
    background: 'var(--card-bg)', borderRadius: 14, marginBottom: 10,
    boxShadow: 'var(--card-shadow)',
    display: 'flex', alignItems: 'center', padding: '16px',
    cursor: 'pointer', border: '1px solid var(--card-border)', width: '100%', textAlign: 'left', gap: 12,
  },
  dayBadge: {
    width: 48, height: 48, borderRadius: 12, background: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
  },
  // Video card
  card: {
    background: 'var(--card-bg)', borderRadius: 14, marginBottom: 8,
    boxShadow: 'var(--card-shadow)', overflow: 'hidden',
    display: 'flex', alignItems: 'stretch',
    border: '1px solid var(--card-border)',
  },
  thumbCol: { width: 80, flexShrink: 0, position: 'relative', background: '#0f172a' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardBody: { padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' },
  planName: { fontSize: 14, fontWeight: 800, color: 'var(--text)' },
  urlText: { fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' },
  btnRow: { display: 'flex', gap: 6, marginTop: 4 },
  editBtn: {
    padding: '5px 12px', background: 'var(--primary-bg)', border: 'none',
    borderRadius: 6, color: 'var(--primary-text)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  deleteBtn: {
    padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6, color: 'var(--danger)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', width: '100%',
    maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: '20px 20px 40px',
    color: 'var(--text)',
  },
  modalHandle: { width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' },
  modalTitle: { fontSize: 17, fontWeight: 800, marginBottom: 20, color: 'var(--text)' },
  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)', boxSizing: 'border-box',
  },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
  dayToggle: { display: 'flex', gap: 8 },
  dayBtn: {
    flex: 1, padding: '10px 0', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    background: 'var(--input-bg)', color: 'var(--text-muted)', textAlign: 'center',
  },
  dayBtnActive: { borderColor: 'var(--primary)', background: 'var(--primary-bg)', color: 'var(--primary-text)' },
  preview: { marginTop: 10, borderRadius: 8, overflow: 'hidden', background: '#000' },
  saveBtn: {
    width: '100%', padding: '13px', background: 'var(--header-grad)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
  cancelBtn: {
    width: '100%', padding: '11px', background: 'var(--page-bg)',
    border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer',
    marginTop: 8, color: 'var(--text-sub)', fontWeight: 600,
  },
}

export default function LiveVideosManagePage() {
  const navigate = useNavigate()
  const [videos, setVideos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('lives')   // 'lives' | 'days' | 'videos'
  const [selLive, setSelLive]     = useState(null)
  const [selDay, setSelDay]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    getLiveVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function goBack() {
    if (view === 'videos')     { setView('days');  setSelDay(null) }
    else if (view === 'days')  { setView('lives'); setSelLive(null) }
    else                       { navigate(-1) }
  }

  // ユニークなライブ名一覧
  const liveNames = [...new Set(
    videos
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(v => v.live_name)
  )]

  // 選択ライブの日程
  const daysForLive = selLive
    ? [...new Set(videos.filter(v => v.live_name === selLive).map(v => v.day))].sort()
    : []

  // 選択ライブ×日程の動画
  const videosForDay = (selLive && selDay != null)
    ? videos
        .filter(v => v.live_name === selLive && v.day === selDay)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : []

  const headerTitle = view === 'videos'
    ? `${selLive} › ${selDay}日目`
    : view === 'days'
    ? selLive
    : 'ライブ動画管理'

  function openAdd() {
    setEditing(null)
    setForm({
      ...EMPTY,
      live_name: selLive || '',
      day: selDay ?? 1,
    })
    setShowModal(true)
  }
  function openEdit(v) {
    setEditing(v)
    setForm({ live_name: v.live_name, day: v.day ?? 1, plan_name: v.plan_name ?? '', youtube_url: v.youtube_url, display_order: String(v.display_order ?? '') })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.live_name.trim())   { alert('ライブ名を入力してください'); return }
    if (!form.plan_name.trim())   { alert('企画名を入力してください'); return }
    if (!form.youtube_url.trim()) { alert('YouTube URLを入力してください'); return }
    if (!getYouTubeId(form.youtube_url)) { alert('YouTube URLの形式が正しくありません'); return }
    setSaving(true)
    try {
      let displayOrder
      if (form.display_order !== '') {
        displayOrder = Number(form.display_order)
      } else if (!editing) {
        const sameGroup = videos.filter(v => v.live_name === form.live_name.trim() && v.day === Number(form.day))
        const maxOrder = sameGroup.length > 0 ? Math.max(...sameGroup.map(v => v.display_order ?? 0)) : -1
        displayOrder = maxOrder + 1
      } else {
        displayOrder = 0
      }
      const payload = {
        live_name:     form.live_name.trim(),
        day:           Number(form.day),
        plan_name:     form.plan_name.trim(),
        youtube_url:   form.youtube_url.trim(),
        display_order: displayOrder,
      }
      if (editing) {
        const updated = await updateLiveVideo({ video_id: editing.video_id, ...payload })
        setVideos(prev => prev.map(v => v.video_id === editing.video_id ? updated : v))
      } else {
        const created = await createLiveVideo(payload)
        setVideos(prev => [...prev, created])
      }
      setShowModal(false)
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(videoId) {
    if (!window.confirm('この動画を削除しますか？')) return
    try {
      await deleteLiveVideo(videoId)
      setVideos(prev => prev.filter(v => v.video_id !== videoId))
    } catch (e) {
      alert('エラー: ' + e.message)
    }
  }

  const previewId  = getYouTubeId(form.youtube_url)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle}/>
        <button style={s.backBtn} onClick={goBack}>←</button>
        <span style={s.headerTitle}>{headerTitle}</span>
      </div>

      <div style={s.content}>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>}

        {/* ── Level 1: ライブ一覧 ── */}
        {!loading && view === 'lives' && (
          <>
            <button style={s.addBtn} onClick={openAdd}>＋ 動画を追加</button>
            {liveNames.length === 0 && (
              <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>動画が登録されていません</div>
            )}
            {liveNames.map(liveName => {
              const liveVids = videos.filter(v => v.live_name === liveName)
              const days  = [...new Set(liveVids.map(v => v.day))].sort()
              const total = liveVids.length
              return (
                <button key={liveName} style={s.liveCard}
                  onClick={() => { setSelLive(liveName); setView('days') }}>
                  <div style={{ flex: 1 }}>
                    <div style={s.liveCardTitle}>{liveName}</div>
                    <div style={s.liveCardSub}>
                      {days.map(d => `${d}日目`).join(' / ')} · {total}企画
                    </div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
                </button>
              )
            })}
          </>
        )}

        {/* ── Level 2: 日程選択 ── */}
        {!loading && view === 'days' && (
          <>
            <button style={s.addBtn} onClick={openAdd}>＋ 動画を追加</button>
            {daysForLive.map(day => {
              const cnt = videos.filter(v => v.live_name === selLive && v.day === day).length
              return (
                <button key={day} style={s.dayCard}
                  onClick={() => { setSelDay(day); setView('videos') }}>
                  <div style={s.dayBadge}>{day}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{day}日目</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cnt}企画</div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
                </button>
              )
            })}
          </>
        )}

        {/* ── Level 3: 動画一覧 ── */}
        {!loading && view === 'videos' && (
          <>
            <button style={s.addBtn} onClick={openAdd}>＋ 動画を追加</button>
            {videosForDay.length === 0 && (
              <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>動画がありません</div>
            )}
            {videosForDay.map(v => {
              const vid = getYouTubeId(v.youtube_url)
              return (
                <div key={v.video_id} style={s.card}>
                  <div style={s.thumbCol}>
                    {vid
                      ? <img style={s.thumbImg} src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt=""/>
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>NG</div>
                    }
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.planName}>{v.plan_name}</div>
                    <div style={s.urlText}>{v.youtube_url}</div>
                    <div style={s.btnRow}>
                      <button style={s.editBtn} onClick={() => openEdit(v)}>編集</button>
                      <button style={s.deleteBtn} onClick={() => handleDelete(v.video_id)}>削除</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={s.modal}>
            <div style={s.modalHandle}/>
            <div style={s.modalTitle}>{editing ? '動画を編集' : '動画を追加'}</div>

            <div style={s.fieldGroup}>
              <label style={s.label}>ライブ名 *</label>
              <input
                style={s.input} list="livename-list" placeholder="例：春ライブ2025"
                value={form.live_name}
                onChange={e => setForm(f => ({ ...f, live_name: e.target.value }))}
              />
              <datalist id="livename-list">
                {liveNames.map(n => <option key={n} value={n}/>)}
              </datalist>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>日程 *</label>
              <div style={s.dayToggle}>
                {[1, 2].map(d => (
                  <button key={d}
                    style={{ ...s.dayBtn, ...(form.day === d ? s.dayBtnActive : {}) }}
                    onClick={() => setForm(f => ({ ...f, day: d }))}>
                    {d}日目
                  </button>
                ))}
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>企画名（バンド名） *</label>
              <input
                style={s.input} placeholder="例：ゼロから始まる音楽生活"
                value={form.plan_name}
                onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))}
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>YouTube URL *</label>
              <input
                style={s.input} placeholder="https://youtu.be/..."
                value={form.youtube_url}
                onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
              />
              <div style={s.hint}>youtube.com/watch?v=… または youtu.be/… 形式</div>
              {previewId && (
                <div style={s.preview}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${previewId}`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title="preview"
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>表示順（小さい数が上）</label>
              <input
                style={s.input} type="number" placeholder="空欄で自動（末尾）"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
              />
            </div>

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存する'}
            </button>
            <button style={s.cancelBtn} onClick={() => setShowModal(false)}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  )
}
