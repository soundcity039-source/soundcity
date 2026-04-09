import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const PARTS = ['Vo', 'ギタボ', 'Gt', 'Ba', 'Dr', 'Key', 'Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']

const ROLE_COLORS = {
  '支部長':  { bg: '#fef3c7', color: '#92400e' },
  '副支部長': { bg: '#e0f2fe', color: '#0369a1' },
  '会計':    { bg: '#fce7f3', color: '#9d174d' },
  'ライブ係': { bg: '#ede9fe', color: '#5b21b6' },
  'PA':      { bg: '#f0fdf4', color: '#166534' },
  '新歓係':  { bg: '#fff7ed', color: '#9a3412' },
}
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative' },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  myProfileBtn: {
    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
    borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    position: 'relative',
  },
  filterArea: {
    background: '#fff', padding: '14px 16px',
    boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
  },
  searchWrap: {
    position: 'relative', marginBottom: 10,
  },
  searchIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    fontSize: 15, color: '#94a3b8',
  },
  searchInput: {
    width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, boxSizing: 'border-box',
    background: '#f8fafc', outline: 'none',
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterSelect: {
    padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 12, fontWeight: 500, background: '#f8fafc', color: '#475569',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
    padding: '16px', alignItems: 'start',
  },
  card: {
    background: '#fff', borderRadius: 14, padding: '14px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center', border: '1px solid rgba(0,0,0,0.04)',
    transition: 'transform 0.1s',
  },
  avatar: {
    width: 60, height: 60, borderRadius: '50%', objectFit: 'cover',
    background: '#e2e8f0', marginBottom: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
    border: '2px solid #f1f5f9',
  },
  name: { fontSize: 12, fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', lineHeight: 1.3 },
  part: { fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 500 },
  role: { fontSize: 9, fontWeight: 700, marginTop: 4, padding: '2px 7px', borderRadius: 8 },
  countBadge: {
    fontSize: 12, color: '#64748b', padding: '4px 0',
    fontWeight: 500,
  },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px 20px', gridColumn: '1/-1', fontSize: 14 },
  loading: { textAlign: 'center', color: '#94a3b8', padding: 40, gridColumn: '1/-1' },
}

function getParts(member) {
  if (!member.main_part) return []
  return member.main_part.split(',').filter(Boolean)
}

function filterByPart(members, selectedPart) {
  if (!selectedPart) return members
  if (selectedPart === 'Vo') return members.filter(m => {
    const parts = getParts(m)
    return parts.includes('Vo') || parts.includes('ギタボ')
  })
  if (selectedPart === 'Gt') return members.filter(m => {
    const parts = getParts(m)
    return parts.includes('Gt') || parts.includes('ギタボ')
  })
  return members.filter(m => getParts(m).includes(selectedPart))
}

export default function MemberListPage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [partFilter, setPartFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')

  useEffect(() => {
    getMembers({ is_active: true })
      .then(res => setMembers(res.members || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  let filtered = members.filter(m => m.is_active !== false)
  if (search) filtered = filtered.filter(m => m.full_name?.includes(search))
  filtered = filterByPart(filtered, partFilter)
  if (gradeFilter) filtered = filtered.filter(m => String(m.grade) === gradeFilter)
  if (genderFilter) filtered = filtered.filter(m => m.gender === genderFilter)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
          <span style={s.headerTitle}>メンバー</span>
        </div>
        <button style={s.myProfileBtn} onClick={() => navigate('/profile/edit')}>
          マイページ
        </button>
      </div>
      <div style={s.filterArea}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="名前で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={s.filterRow}>
          <select style={s.filterSelect} value={partFilter} onChange={e => setPartFilter(e.target.value)}>
            <option value="">パート 全て</option>
            {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={s.filterSelect} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
            <option value="">学年 全て</option>
            {GRADES.map(g => <option key={g} value={g}>{g}年</option>)}
          </select>
          <select style={s.filterSelect} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
            <option value="">性別 全て</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div style={s.grid}>
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && filtered.length === 0 && <div style={s.empty}>該当するメンバーがいません</div>}
        {!loading && filtered.map(m => (
          <div key={m.member_id} style={s.card} onClick={() => navigate(`/members/${m.member_id}`)}>
            {m.photo_url
              ? <img src={m.photo_url} alt={m.full_name} style={{ ...s.avatar, background: 'transparent' }} />
              : <div style={s.avatar}>👤</div>
            }
            <div style={s.name}>{m.full_name}</div>
            {m.main_part && <div style={s.part}>{m.main_part.split(',').filter(Boolean).join('/')}</div>}
            {m.role && ROLE_COLORS[m.role] && (
              <div style={{ ...s.role, background: ROLE_COLORS[m.role].bg, color: ROLE_COLORS[m.role].color }}>
                {m.role}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
