import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMembers, getMemberHistory } from '../api.js'

const ROLE_COLORS = {
  '支部長':  { bg: '#fef3c7', color: '#92400e' },
  '副支部長': { bg: '#e0f2fe', color: '#0369a1' },
  '会計':    { bg: '#fce7f3', color: '#9d174d' },
  'ライブ係': { bg: '#ede9fe', color: '#5b21b6' },
  'PA':      { bg: '#f0fdf4', color: '#166534' },
  '新歓係':  { bg: '#fff7ed', color: '#9a3412' },
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: 700 },
  profileHero: {
    background: 'linear-gradient(160deg, #6366f1 0%, #4f46e5 60%, #818cf8 100%)',
    padding: '32px 20px 28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', top: -40, right: -40, width: 140, height: 140,
    borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
  },
  heroCircle2: {
    position: 'absolute', bottom: -20, left: -20, width: 100, height: 100,
    borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
  },
  avatarWrap: {
    width: 96, height: 96, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.5)',
    overflow: 'hidden', marginBottom: 14, position: 'relative',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 96, height: 96, objectFit: 'cover' },
  avatarIcon: { fontSize: 44, color: 'rgba(255,255,255,0.8)' },
  heroName: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 },
  heroPart: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500,
  },
  roleBadge: {
    marginTop: 8, display: 'inline-block', padding: '4px 14px',
    borderRadius: 20, fontSize: 12, fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)', color: '#fff',
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 16, overflow: 'hidden',
    marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardTitle: {
    padding: '14px 16px', fontSize: 13, fontWeight: 800, color: '#1e293b',
    borderBottom: '1px solid #f1f5f9', letterSpacing: 0.3,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  row: {
    display: 'flex', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid #f8fafc',
  },
  rowLabel: { minWidth: 110, fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.3 },
  rowValue: { fontSize: 14, color: '#334155', flex: 1, fontWeight: 500 },
  historyItem: {
    padding: '14px 16px', borderBottom: '1px solid #f8fafc',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  historyMeta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 },
  historyLive: { fontSize: 11, color: '#94a3b8', fontWeight: 600 },
  historyDate: { fontSize: 11, color: '#94a3b8' },
  historyBand: { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  historyPart: {
    display: 'inline-block', padding: '3px 10px',
    background: '#ede9fe', borderRadius: 8,
    fontSize: 11, color: '#5b21b6', fontWeight: 700,
    alignSelf: 'flex-start', marginTop: 2,
  },
  empty: { padding: '20px', fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  loading: { textAlign: 'center', color: '#94a3b8', padding: 40 },
  notFound: { textAlign: 'center', color: '#94a3b8', padding: 40 },
}

export default function MemberDetailPage() {
  const navigate = useNavigate()
  const { memberId } = useParams()
  const [member, setMember] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMembers({ member_id: memberId }),
      getMemberHistory(memberId),
    ])
      .then(([membersRes, historyRes]) => {
        const members = membersRes.members || membersRes || []
        setMember(members.find(m => m.member_id === memberId) || null)
        // ライブ日付で降順ソート
        const sorted = [...historyRes].sort((a, b) => {
          const da = a.plan?.live?.date1 || ''
          const db = b.plan?.live?.date1 || ''
          return db.localeCompare(da)
        })
        setHistory(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [memberId])

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>プロフィール</span>
      </div>
      {loading && <div style={s.loading}>読み込み中...</div>}
      {!loading && !member && <div style={s.notFound}>メンバーが見つかりません</div>}
      {!loading && member && (
        <>
          <div style={s.profileHero}>
            <div style={s.heroCircle1} />
            <div style={s.heroCircle2} />
            <div style={s.avatarWrap}>
              {member.photo_url
                ? <img src={member.photo_url} alt={member.full_name} style={s.avatar} />
                : <span style={s.avatarIcon}>👤</span>
              }
            </div>
            <div style={s.heroName}>{member.full_name}</div>
            {member.main_part && (
              <div style={s.heroPart}>{member.main_part.split(',').filter(Boolean).join(' / ')}</div>
            )}
            {member.role && (
              <div style={s.roleBadge}>{member.role}</div>
            )}
          </div>
          <div style={s.content}>
            {(member.grade || member.gender || member.fav_bands || member.want_parts) && (
              <div style={s.card}>
                <div style={s.cardTitle}>📋 プロフィール情報</div>
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
                    <span style={s.rowValue}>{member.want_parts.split(',').filter(Boolean).join(' / ')}</span>
                  </div>
                )}
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>🎸 出演履歴</div>
              {history.length === 0
                ? <div style={s.empty}>出演履歴がありません</div>
                : history.map((c, i) => (
                  <div key={i} style={s.historyItem}>
                    <div style={s.historyMeta}>
                      <span style={s.historyLive}>{c.plan?.live?.live_name || 'ライブ名不明'}</span>
                      {c.plan?.live?.date1 && (
                        <span style={s.historyDate}>
                          {new Date(c.plan.live.date1).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div style={s.historyBand}>{c.plan?.band_name || '企画名不明'}</div>
                    <div style={s.historyPart}>{c.part}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
