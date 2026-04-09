import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers, updateMember } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const ROLES = ['支部長', '副支部長', '会計', 'ライブ係', 'PA', '新歓係']
const PROTECTED_ROLES = ['支部長', '会計']
const SUPER_ROLES = ['支部長', '会計']

const ROLE_COLORS = {
  '支部長':  { bg: '#fef3c7', color: '#92400e' },
  '副支部長': { bg: '#e0f2fe', color: '#0369a1' },
  '会計':    { bg: '#fce7f3', color: '#9d174d' },
  'ライブ係': { bg: '#ede9fe', color: '#5b21b6' },
  'PA':      { bg: '#f0fdf4', color: '#166534' },
  '新歓係':  { bg: '#fff7ed', color: '#9a3412' },
}

const SORT_OPTIONS = [
  { value: 'name', label: '名前順' },
  { value: 'grade', label: '学年順' },
  { value: 'role', label: '役職順' },
]

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '10px 12px', maxWidth: 480, margin: '0 auto' },
  searchInput: {
    width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, boxSizing: 'border-box', marginBottom: 8,
    background: '#f8fafc', outline: 'none',
  },
  controlRow: { display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  filterBtn: {
    padding: '5px 12px', border: '1.5px solid #e2e8f0', borderRadius: 20,
    background: '#fff', fontSize: 12, cursor: 'pointer', color: '#475569', whiteSpace: 'nowrap', fontWeight: 500,
  },
  filterBtnActive: { background: '#1e293b', color: '#fff', borderColor: '#1e293b', fontWeight: 700 },
  sortSelect: {
    padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 20,
    background: '#fff', fontSize: 12, color: '#475569', marginLeft: 'auto', fontWeight: 500,
  },
  filterRow2: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  filterSelect: {
    padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 20,
    background: '#fff', fontSize: 12, color: '#475569', fontWeight: 500,
  },
  // Compact row card
  card: {
    background: '#fff', borderRadius: 10, marginBottom: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden',
  },
  cardInactive: { opacity: 0.45 },
  cardRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', cursor: 'pointer',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
    background: '#f0f0f0', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  metaText: { fontSize: 11, color: '#94a3b8' },
  badges: { display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 },
  badge: { padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600 },
  badgeAdmin:    { background: '#e9d8fd', color: '#6b46c1' },
  badgeActive:   { background: '#e6f9ed', color: '#06C755' },
  badgeInactive: { background: '#f5f5f5', color: '#888' },
  chevron: { fontSize: 13, color: '#cbd5e1', flexShrink: 0, transition: 'transform 0.15s' },
  // Expanded action drawer
  actionArea: { padding: '8px 12px 12px', borderTop: '1px solid #f8fafc', background: '#fafafa' },
  actionRow: { display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  toggleBtn: {
    padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6,
    background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555', whiteSpace: 'nowrap',
  },
  toggleBtnDanger: {
    padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: 6,
    background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: '#e53e3e', whiteSpace: 'nowrap',
  },
  toggleBtnDisabled: {
    padding: '5px 10px', border: '1px solid #eee', borderRadius: 6,
    background: '#fafafa', fontSize: 12, cursor: 'not-allowed', color: '#bbb', whiteSpace: 'nowrap',
  },
  roleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  roleLabel: { fontSize: 12, color: '#888', whiteSpace: 'nowrap' },
  roleSelect: {
    flex: 1, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6,
    fontSize: 12, background: '#fff',
  },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
}

const ROLE_ORDER = ['支部長', '副支部長', '会計', 'ライブ係', 'PA', '新歓係']

export default function MemberManagePage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const canManage = SUPER_ROLES.includes(currentUser?.role)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [expanded, setExpanded] = useState(new Set())

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    getMembers({ all: true })
      .then(res => setMembers(res.members || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(member) {
    if (PROTECTED_ROLES.includes(member.role)) return
    const isDeactivating = member.is_active !== false
    const msg = isDeactivating
      ? `「${member.full_name}」を退部処理しますか？`
      : `「${member.full_name}」を復帰させますか？`
    if (!window.confirm(msg)) return
    const newVal = !member.is_active
    try {
      await updateMember({ member_id: member.member_id, is_active: newVal })
      setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, is_active: newVal } : m))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  async function toggleAdmin(member) {
    if (PROTECTED_ROLES.includes(member.role)) return
    const isRemoving = member.is_admin
    const msg = isRemoving
      ? `「${member.full_name}」の管理者権限を解除しますか？`
      : `「${member.full_name}」を管理者にしますか？`
    if (!window.confirm(msg)) return
    const newVal = !member.is_admin
    try {
      await updateMember({ member_id: member.member_id, is_admin: newVal })
      setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, is_admin: newVal } : m))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  async function changeRole(member, newRole) {
    const role = newRole || null
    const label = role || 'なし'
    const msg = role
      ? `「${member.full_name}」の役職を「${label}」に変更しますか？`
      : `「${member.full_name}」の役職を解除しますか？`
    if (!window.confirm(msg)) return
    try {
      const extra = {}
      if (PROTECTED_ROLES.includes(role)) {
        extra.is_admin = true
        extra.is_active = true
      }
      await updateMember({ member_id: member.member_id, role, ...extra })
      setMembers(prev => prev.map(m =>
        m.member_id === member.member_id ? { ...m, role, ...extra } : m
      ))
    } catch (e) {
      alert('エラーが発生しました')
    }
  }

  let displayed = showInactive ? members : members.filter(m => m.is_active !== false)
  if (search) displayed = displayed.filter(m => m.full_name?.includes(search))
  if (gradeFilter) displayed = displayed.filter(m => String(m.grade) === gradeFilter)
  if (genderFilter) displayed = displayed.filter(m => m.gender === genderFilter)
  if (roleFilter === '__none__') displayed = displayed.filter(m => !m.role)
  else if (roleFilter) displayed = displayed.filter(m => m.role === roleFilter)
  displayed = [...displayed].sort((a, b) => {
    if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '', 'ja')
    if (sortBy === 'grade') return (a.grade || 99) - (b.grade || 99)
    if (sortBy === 'role') {
      const ai = ROLE_ORDER.indexOf(a.role)
      const bi = ROLE_ORDER.indexOf(b.role)
      if (ai === -1 && bi === -1) return (a.full_name || '').localeCompare(b.full_name || '', 'ja')
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    }
    return 0
  })

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>メンバー管理</span>
      </div>
      <div style={s.content}>
        <input
          style={s.searchInput}
          placeholder="名前で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={s.controlRow}>
          <button
            style={{ ...s.filterBtn, ...(!showInactive ? s.filterBtnActive : {}) }}
            onClick={() => setShowInactive(false)}
          >在籍中</button>
          <button
            style={{ ...s.filterBtn, ...(showInactive ? s.filterBtnActive : {}) }}
            onClick={() => setShowInactive(true)}
          >全員</button>
          <select style={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={s.filterRow2}>
          <select style={s.filterSelect} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
            <option value="">学年(全て)</option>
            {[1,2,3,4].map(g => <option key={g} value={g}>{g}年</option>)}
          </select>
          <select style={s.filterSelect} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
            <option value="">性別(全て)</option>
            {['男','女','その他'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select style={s.filterSelect} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">役職(全て)</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            <option value="__none__">役職なし</option>
          </select>
        </div>

        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && displayed.length === 0 && <div style={s.empty}>該当するメンバーがいません</div>}
        {!loading && displayed.map(member => {
          const isProtected = PROTECTED_ROLES.includes(member.role)
          const roleStyle   = ROLE_COLORS[member.role] || null
          const isOpen      = expanded.has(member.member_id)
          const metaParts   = [
            member.main_part ? member.main_part.split(',').filter(Boolean).join('/') : null,
            member.grade ? `${member.grade}年` : null,
            member.gender || null,
          ].filter(Boolean).join(' · ')

          return (
            <div key={member.member_id} className="tap-card" style={{ ...s.card, ...(member.is_active === false ? s.cardInactive : {}) }}>
              {/* Compact row */}
              <div style={s.cardRow} onClick={() => toggleExpand(member.member_id)}>
                {member.photo_url
                  ? <img src={member.photo_url} alt="" style={{ ...s.avatar, background: 'transparent' }}/>
                  : <div style={s.avatar}>👤</div>
                }
                <div style={s.info}>
                  <div style={s.nameRow}>
                    <span style={s.name}>{member.full_name}</span>
                    {metaParts && <span style={s.metaText}>{metaParts}</span>}
                  </div>
                  <div style={s.badges}>
                    {member.role && roleStyle && <span style={{ ...s.badge, ...roleStyle }}>{member.role}</span>}
                    {member.is_admin && <span style={{ ...s.badge, ...s.badgeAdmin }}>管理者</span>}
                    <span style={{ ...s.badge, ...(member.is_active !== false ? s.badgeActive : s.badgeInactive) }}>
                      {member.is_active !== false ? '在籍' : '退部'}
                    </span>
                  </div>
                </div>
                <span style={{ ...s.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
              </div>

              {/* Expanded action drawer */}
              {isOpen && (
                <div style={s.actionArea}>
                  <div style={s.actionRow}>
                    {canManage ? (
                      <button style={isProtected ? s.toggleBtnDisabled : s.toggleBtnDanger}
                        disabled={isProtected} onClick={() => toggleActive(member)}
                        title={isProtected ? `${member.role}は変更できません` : ''}>
                        {member.is_active !== false ? '退部処理' : '復帰'}
                      </button>
                    ) : (
                      <button style={s.toggleBtnDisabled} disabled>
                        {member.is_active !== false ? '退部処理' : '復帰'}
                      </button>
                    )}
                    <button
                      style={isProtected ? s.toggleBtnDisabled : (member.is_admin ? s.toggleBtnDanger : s.toggleBtn)}
                      disabled={isProtected} onClick={() => toggleAdmin(member)}
                      title={isProtected ? `${member.role}は変更できません` : ''}>
                      {member.is_admin ? '管理者解除' : '管理者にする'}
                    </button>
                  </div>
                  <div style={s.roleRow}>
                    <span style={s.roleLabel}>役職：</span>
                    <select
                      style={{ ...s.roleSelect, ...(canManage ? {} : { background: '#f5f5f5', color: '#bbb' }) }}
                      value={member.role || ''}
                      onChange={e => canManage && changeRole(member, e.target.value)}
                      disabled={!canManage}>
                      <option value="">なし</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
