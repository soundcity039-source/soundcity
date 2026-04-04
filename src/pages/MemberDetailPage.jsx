import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMembers } from '../api.js'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  profileTop: {
    background: '#fff', padding: '32px 20px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    borderBottom: '1px solid #eee',
  },
  avatar: {
    width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
    marginBottom: 12, border: '3px solid #eee',
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: '50%', background: '#f0f0f0',
    marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
  },
  name: { fontSize: 22, fontWeight: 700, color: '#333' },
  mainPart: { fontSize: 14, color: '#888', marginTop: 4 },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  row: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' },
  rowLabel: { minWidth: 100, fontSize: 13, color: '#888' },
  rowValue: { fontSize: 14, color: '#333', flex: 1 },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
  notFound: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function MemberDetailPage() {
  const navigate = useNavigate()
  const { memberId } = useParams()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMembers({ member_id: memberId })
      .then(res => {
        const members = res.members || res || []
        setMember(members.find(m => m.member_id === memberId) || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [memberId])

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        プロフィール
      </div>
      {loading && <div style={s.loading}>読み込み中...</div>}
      {!loading && !member && <div style={s.notFound}>メンバーが見つかりません</div>}
      {!loading && member && (
        <>
          <div style={s.profileTop}>
            {member.photo_url
              ? <img src={member.photo_url} alt={member.full_name} style={s.avatar} />
              : <div style={s.avatarPlaceholder}>👤</div>
            }
            <div style={s.name}>{member.full_name}</div>
            {member.main_part && <div style={s.mainPart}>{member.main_part}</div>}
          </div>
          <div style={s.content}>
            <div style={s.card}>
              {member.grade && (
                <div style={s.row}>
                  <span style={s.rowLabel}>学年</span>
                  <span style={s.rowValue}>{member.grade}年生</span>
                </div>
              )}
              {member.gender && (
                <div style={s.row}>
                  <span style={s.rowLabel}>性別</span>
                  <span style={s.rowValue}>{member.gender}</span>
                </div>
              )}
              {member.fav_bands && (
                <div style={s.row}>
                  <span style={s.rowLabel}>好きなバンド</span>
                  <span style={s.rowValue}>{member.fav_bands}</span>
                </div>
              )}
              {member.want_parts && (
                <div style={s.row}>
                  <span style={s.rowLabel}>やりたいパート</span>
                  <span style={s.rowValue}>{member.want_parts}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
