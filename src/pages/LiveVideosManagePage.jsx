import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLiveVideos, createLiveVideo, updateLiveVideo, deleteLiveVideo } from '../api.js'

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
  return m ? m[1] : null
}

const EMPTY = { live_name: '', day: 1, plan_name: '', youtube_url: '', display_order: '' }

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
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
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  addBtn: {
    width: '100%', padding: '12px', background: '#1e293b', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16,
  },
  // Group headers
  groupHeader: {
    fontSize: 13, fontWeight: 800, color: '#64748b',
    padding: '6px 4px', marginBottom: 6, marginTop: 4,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  // Card
  card: {
    background: '#fff', borderRadius: 14, marginBottom: 8,
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden',
    display: 'flex', alignItems: 'stretch',
  },
  thumbCol: { width: 80, flexShrink: 0, position: 'relative', background: '#0f172a' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardBody: { padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' },
  planName: { fontSize: 14, fontWeight: 800, color: '#1e293b' },
  urlText: { fontSize: 10, color: '#94a3b8', wordBreak: 'break-all' },
  btnRow: { display: 'flex', gap: 6, marginTop: 4 },
  editBtn: {
    padding: '5px 12px', background: '#eef2ff', border: 'none',
    borderRadius: 6, color: '#4c51bf', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  deleteBtn: {
    padding: '5px 12px', background: '#fff5f5', border: '1px solid #fecaca',
    borderRadius: 6, color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '20px 20px 0 0', width: '100%',
    maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: '20px 20px 40px',
  },
  modalHandle: { width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' },
  modalTitle: { fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#1e293b' },
  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, background: '#f8fafc', boxSizing: 'border-box',
  },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  dayToggle: { display: 'flex', gap: 8 },
  dayBtn: {
    flex: 1, padding: '10px 0', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    background: '#fff', color: '#94a3b8', textAlign: 'center',
  },
  dayBtnActive: { borderColor: '#1e293b', background: '#f8fafc', color: '#1e293b' },
  preview: { marginTop: 10, borderRadius: 8, overflow: 'hidden', background: '#000' },
  saveBtn: {
    width: '100%', padding: '13px', background: 'linear-gradient(135deg,#1e293b,#0f172a)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
  cancelBtn: {
    width: '100%', padding: '11px', background: '#f1f5f9',
    border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer',
    marginTop: 8, color: '#64748b', fontWeight: 600,
  },
}

export default function LiveVideosManagePage() {
  const navigate = useNavigate()
  const [videos, setVideos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    getLiveVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const liveNames = [...new Set(videos.map(v => v.live_name))]

  // ライブ名 × 日程でグループ化
  function groupedVideos() {
    const groups = []
    for (const liveName of liveNames) {
      const days = [...new Set(videos.filter(v => v.live_name === liveName).map(v => v.day))].sort()
      for (const day of days) {
        groups.push({
          key: `${liveName}-${day}`,
          liveName, day,
          items: videos
            .filter(v => v.live_name === liveName && v.day === day)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        })
      }
    }
    return groups
  }

  function openAdd() {
    setEditing(null); setForm(EMPTY); setShowModal(true)
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
      const payload = {
        live_name:     form.live_name.trim(),
        day:           Number(form.day),
        plan_name:     form.plan_name.trim(),
        youtube_url:   form.youtube_url.trim(),
        display_order: form.display_order !== '' ? Number(form.display_order) : 0,
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

  const previewId = getYouTubeId(form.youtube_url)
  const groups    = groupedVideos()

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle}/>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>ライブ動画管理</span>
      </div>

      <div style={s.content}>
        <button style={s.addBtn} onClick={openAdd}>＋ 動画を追加</button>

        {loading && <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>}
        {!loading && videos.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>動画が登録されていません</div>
        )}

        {/* グループ表示 */}
        {!loading && groups.map(group => (
          <div key={group.key}>
            <div style={s.groupHeader}>
              <span style={{
                background: '#1e293b', color: '#fff',
                padding: '2px 10px', borderRadius: 6, fontSize: 12,
              }}>{group.liveName}</span>
              <span style={{
                background: '#e2e8f0', color: '#64748b',
                padding: '2px 8px', borderRadius: 6, fontSize: 12,
              }}>{group.day}日目</span>
            </div>
            {group.items.map(v => {
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
          </div>
        ))}
      </div>

      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={s.modal}>
            <div style={s.modalHandle}/>
            <div style={s.modalTitle}>{editing ? '動画を編集' : '動画を追加'}</div>

            {/* ライブ名 */}
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

            {/* 日程 */}
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

            {/* 企画名 */}
            <div style={s.fieldGroup}>
              <label style={s.label}>企画名（バンド名） *</label>
              <input
                style={s.input} placeholder="例：ゼロから始まる音楽生活"
                value={form.plan_name}
                onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))}
              />
            </div>

            {/* YouTube URL */}
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

            {/* 表示順 */}
            <div style={s.fieldGroup}>
              <label style={s.label}>表示順（小さい数が上）</label>
              <input
                style={s.input} type="number" placeholder="0"
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
