import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const PARTS = ['Vo', 'ギタボ', 'Gt', 'Ba', 'Dr', 'Key', 'Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  myProfileBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    borderRadius: 20, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
  },
  filterArea: {
    background: '#fff', padding: '12px 16px', borderBottom: '1px solid #eee',
  },
  searchInput: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', marginBottom: 8,
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterSelect: {
    padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6,
    fontSize: 13, background: '#fff',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
    padding: '16px',
  },
  card: {
    background: '#fff', borderRadius: 10, padding: '12px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  avatar: {
    width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
    background: '#ddd', marginBottom: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
  },
  name: { fontSize: 13, fontWeight: 600, color: '#333', wordBreak: 'break-all' },
  part: { fontSize: 11, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', padding: 40, gridColumn: '1/-1' },
  loading: { textAlign: 'center', color: '#aaa', padding: 40, gridColumn: '1/-1' },
}

function filterByPart(members, selectedPart) {
  if (!selectedPart) return members
  if (selectedPart === 'Vo') return members.filter(m => m.main_part === 'Vo' || m.main_part === 'ギタボ')
  if (selectedPart === 'Gt') return members.filter(m => m.main_part === 'Gt' || m.main_part === 'ギタボ')
  return members.filter(m => m.main_part === selectedPart)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
          <span>メンバー</span>
        </div>
        <button style={s.myProfileBtn} onClick={() => navigate('/profile/edit')}>
          プロフィール編集
        </button>
      </div>
      <div style={s.filterArea}>
        <input
          style={s.searchInput}
          placeholder="名前で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={s.filterRow}>
          <select style={s.filterSelect} value={partFilter} onChange={e => setPartFilter(e.target.value)}>
            <option value="">パート(全て)</option>
            {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={s.filterSelect} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
            <option value="">学年(全て)</option>
            {GRADES.map(g => <option key={g} value={g}>{g}年</option>)}
          </select>
          <select style={s.filterSelect} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
            <option value="">性別(全て)</option>
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
            {m.main_part && <div style={s.part}>{m.main_part}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
