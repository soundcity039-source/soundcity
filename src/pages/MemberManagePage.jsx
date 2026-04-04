import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers, updateMember } from '../api.js'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#2d3748', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  filterRow: { display: 'flex', gap: 8, marginBottom: 16 },
  filterBtn: {
    padding: '7px 14px', border: '1px solid #ddd', borderRadius: 20,
    background: '#fff', fontSize: 13, cursor: 'pointer', color: '#555',
  },
  filterBtnActive: { background: '#2d3748', color: '#fff', borderColor: '#2d3748' },
  card: {
    background: '#fff', borderRadius: 12, padding: '14px 16px',
    marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  cardInactive: { opacity: 0.5 },
  avatar: {
    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
    background: '#f0f0f0', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: 700 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  badges: { display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  badge: {
    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
  },
  badgeAdmin: { background: '#e9d8fd', color: '#6b46c1' },
  badgeActive: { background: '#e6f9ed', color: '#06C755' },
  badgeInactive: { background: '#f5f5f5', color: '#888' },
  actionBtns: { display: 'flex', flexDirection: 'column', gap: 6 },
  toggleBtn: {
    padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6,
    background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555', whiteSpace: 'nowrap',
  },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function MemberManagePage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    getMembers({})
      .then(res => setMembers(res.members || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(member) {
    const newVal = !member.is_active
    try {
      await updateMember({ member_id: member.member_id, is_active: newVal })
      setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, is_active: newVal } : m))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  async function toggleAdmin(member) {
    const newVal = !member.is_admin
    try {
      await updateMember({ member_id: member.member_id, is_admin: newVal })
      setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, is_admin: newVal } : m))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  const displayed = showInactive ? members : members.filter(m => m.is_active !== false)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        メンバー管理
      </div>
      <div style={s.content}>
        <div style={s.filterRow}>
          <button
            style={{ ...s.filterBtn, ...(!showInactive ? s.filterBtnActive : {}) }}
            onClick={() => setShowInactive(false)}
          >在籍中</button>
          <button
            style={{ ...s.filterBtn, ...(showInactive ? s.filterBtnActive : {}) }}
            onClick={() => setShowInactive(true)}
          >全員</button>
        </div>

        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && displayed.map(member => (
          <div key={member.member_id} style={{ ...s.card, ...(member.is_active === false ? s.cardInactive : {}) }}>
            {member.photo_url
              ? <img src={member.photo_url} alt={member.full_name} style={{ ...s.avatar, background: 'transparent' }} />
              : <div style={s.avatar}>👤</div>
            }
            <div style={s.info}>
              <div style={s.name}>{member.full_name}</div>
              <div style={s.meta}>
                {[member.main_part, member.grade ? `${member.grade}年` : null].filter(Boolean).join(' / ')}
              </div>
              <div style={s.badges}>
                {member.is_admin && <span style={{ ...s.badge, ...s.badgeAdmin }}>幹部</span>}
                <span style={{ ...s.badge, ...(member.is_active !== false ? s.badgeActive : s.badgeInactive) }}>
                  {member.is_active !== false ? '在籍中' : '退部/卒業'}
                </span>
              </div>
            </div>
            <div style={s.actionBtns}>
              <button style={s.toggleBtn} onClick={() => toggleActive(member)}>
                {member.is_active !== false ? '退部処理' : '復帰'}
              </button>
              <button style={s.toggleBtn} onClick={() => toggleAdmin(member)}>
                {member.is_admin ? '幹部解除' : '幹部にする'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
