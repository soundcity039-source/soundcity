import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTemplates, deleteTemplate } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 12, padding: '14px 16px',
    marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  bandName: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  partList: { marginBottom: 10 },
  partRow: { fontSize: 13, color: '#555', padding: '2px 0' },
  actionRow: { display: 'flex', gap: 8 },
  applyBtn: {
    flex: 1, padding: '8px', background: '#e6f9ed', border: 'none',
    borderRadius: 8, color: '#06C755', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  deleteBtn: {
    padding: '8px 14px', background: '#fff5f5', border: 'none',
    borderRadius: 8, color: '#e53e3e', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  inactiveWarning: {
    background: '#fff3e0', borderRadius: 6, padding: '6px 10px',
    fontSize: 12, color: '#e67e22', marginBottom: 8,
  },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function TemplateListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, setFormState, formState } = useApp()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const fromApply = location.state?.from === 'apply'

  useEffect(() => {
    getTemplates(currentUser.line_uid)
      .then(res => setTemplates(res.templates || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.line_uid])

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
    navigate('/apply/b')
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
    return currentUser.is_admin || template.creator_uid === currentUser.line_uid
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        テンプレート一覧
      </div>
      <div style={s.content}>
        {fromApply && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
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
                  一部のメンバーが在籍していないため引用時に空欄になります
                </div>
              )}
              <div style={s.partList}>
                {(template.casts || []).map((c, i) => (
                  <div key={i} style={s.partRow}>
                    {c.part}：{c.member?.full_name || '（未定）'}
                    {c.member?.is_active === false && ' ※退部/卒業'}
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
