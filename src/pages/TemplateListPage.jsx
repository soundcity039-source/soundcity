import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTemplates, deleteTemplate } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
    color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 16, padding: '14px 16px',
    marginBottom: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  bandName: { fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 },
  partList: { marginBottom: 10 },
  partRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: '#334155', padding: '4px 0',
  },
  partBadge: {
    fontSize: 11, fontWeight: 700, color: '#5b21b6',
    background: '#ede9fe', padding: '2px 7px', borderRadius: 6, minWidth: 36, textAlign: 'center',
  },
  actionRow: { display: 'flex', gap: 8, marginTop: 4 },
  applyBtn: {
    flex: 1, padding: '9px', background: '#dcfce7', border: 'none',
    borderRadius: 10, color: '#166534', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  deleteBtn: {
    padding: '9px 14px', background: '#fee2e2', border: 'none',
    borderRadius: 10, color: '#991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  inactiveWarning: {
    background: '#fff7ed', borderRadius: 8, padding: '8px 10px',
    fontSize: 12, color: '#c2410c', marginBottom: 8, fontWeight: 500,
    border: '1px solid #fed7aa',
  },
  empty: { textAlign: 'center', color: '#94a3b8', padding: 40 },
  loading: { textAlign: 'center', color: '#94a3b8', padding: 40 },
}

export default function TemplateListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, setFormState, formState } = useApp()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const fromApply = location.state?.from === 'apply'

  useEffect(() => {
    getTemplates(currentUser.member_id)
      .then(res => setTemplates(res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.member_id])

  function applyTemplate(template) {
    const parts = (template.casts || []).map(c => {
      const hasInactive = c.member && c.member.is_active === false
      return {
        part: c.part,
        member: hasInactive ? null : (c.member || null),
        _wasInactive: hasInactive,
      }
    })
    const hasInactiveMembers = parts.some(p => p._wasInactive)

    setFormState(prev => ({
      ...prev,
      band_name: prev.band_name || template.band_name,
      parts: parts.map(({ _wasInactive, ...p }) => p),
    }))

    if (hasInactiveMembers) {
      alert('一部のメンバーが在籍していないため該当パートを空欄にしました')
    }
    navigate(-1)
  }

  async function handleDelete(template) {
    if (!window.confirm(`「${template.band_name}」のテンプレートを削除しますか？`)) return
    try {
      await deleteTemplate({ template_id: template.template_id })
      setTemplates(prev => prev.filter(t => t.template_id !== template.template_id))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  function canDelete(template) {
    return currentUser.is_admin || template.creator_id === currentUser.member_id
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>テンプレート一覧</span>
      </div>
      <div style={s.content}>
        {fromApply && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
            テンプレートを選んで引用してください
          </div>
        )}
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && templates.length === 0 && <div style={s.empty}>テンプレートがありません</div>}
        {!loading && templates.map(template => {
          const hasInactive = (template.casts || []).some(c => c.member?.is_active === false)
          return (
            <div key={template.template_id} style={s.card}>
              <div style={s.bandName}>{template.band_name}</div>
              {hasInactive && (
                <div style={s.inactiveWarning}>
                  ⚠️ 一部のメンバーが在籍していないため引用時に空欄になります
                </div>
              )}
              <div style={s.partList}>
                {(template.casts || []).map((c, i) => (
                  <div key={i} style={s.partRow}>
                    <span style={s.partBadge}>{c.part}</span>
                    <span>{c.member?.full_name || '未定'}{c.member?.is_active === false && ' ※退部/卒業'}</span>
                  </div>
                ))}
              </div>
              <div style={s.actionRow}>
                {fromApply && (
                  <button style={s.applyBtn} onClick={() => applyTemplate(template)}>
                    このテンプレートを引用
                  </button>
                )}
                {canDelete(template) && (
                  <button style={s.deleteBtn} onClick={() => handleDelete(template)}>削除</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
