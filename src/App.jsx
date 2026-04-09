import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase.js'
import { useApp } from './context/AppContext.jsx'
import BottomNav, { BottomNavSpacer } from './components/BottomNav.jsx'

import RegisterPage from './pages/RegisterPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LiveSelectPage from './pages/LiveSelectPage.jsx'
import ApplyPageA from './pages/ApplyPageA.jsx'
import ApplyPageB from './pages/ApplyPageB.jsx'
import ApplyConfirmPage from './pages/ApplyConfirmPage.jsx'
import ApplicationListPage from './pages/ApplicationListPage.jsx'
import MemberListPage from './pages/MemberListPage.jsx'
import MemberDetailPage from './pages/MemberDetailPage.jsx'
import ProfileEditPage from './pages/ProfileEditPage.jsx'
import TemplateListPage from './pages/TemplateListPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import RoomReservationPage from './pages/RoomReservationPage.jsx'
import LiveVideosPage from './pages/LiveVideosPage.jsx'

const AdminHomePage    = lazy(() => import('./pages/AdminHomePage.jsx'))
const LiveManagePage   = lazy(() => import('./pages/LiveManagePage.jsx'))
const TimetablePage    = lazy(() => import('./pages/TimetablePage.jsx'))
const FeesPage         = lazy(() => import('./pages/FeesPage.jsx'))
const MemberManagePage      = lazy(() => import('./pages/MemberManagePage.jsx'))
const LiveVideosManagePage  = lazy(() => import('./pages/LiveVideosManagePage.jsx'))

const styles = {
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', background: '#f1f5f9', color: '#64748b',
  },
  spinner: {
    width: 36, height: 36, border: '3px solid #e2e8f0',
    borderTop: '3px solid #06C755', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', marginBottom: 16,
  },
  loginPage: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #06C755 150%)',
  },
  loginCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24, padding: '48px 36px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    backdropFilter: 'blur(12px)', width: '88%', maxWidth: 360,
  },
  loginIcon: { fontSize: 56, marginBottom: 8 },
  loginTitle: { fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1 },
  loginSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, textAlign: 'center' },
  loginBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 28px', background: '#fff',
    border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)', width: '100%', justifyContent: 'center',
    color: '#1e293b',
  },
}

function AdminGuard({ children }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/" replace />
  if (!currentUser.is_admin) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#e53e3e', fontFamily: 'sans-serif' }}>
        <h2>アクセス権限がありません</h2>
        <p>幹部専用ページです。</p>
      </div>
    )
  }
  return children
}

function LoginPage() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    if (ua.includes('Line/') && !window.location.href.includes('openExternalBrowser')) {
      const sep = window.location.href.includes('?') ? '&' : '?'
      window.location.href = window.location.href + sep + 'openExternalBrowser=1'
    }
  }, [])

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/soundcity` },
    })
  }

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <img src="/soundcity/logo.jpg" alt="SoundCity" style={{ width: 110, height: 110, borderRadius: 22, objectFit: 'cover', marginBottom: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }} />
        <div style={styles.loginTitle}>SoundCityツール</div>
        <div style={styles.loginSub}>軽音サークル ライブ管理アプリ</div>
        <button style={styles.loginBtn} onClick={handleGoogleLogin} disabled={loading}>
          <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="" />
          {loading ? 'ログイン中...' : 'Googleでログイン'}
        </button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { currentUser, setCurrentUser } = useApp()
  const [initializing, setInitializing] = useState(true)
  const [authUser, setAuthUser] = useState(null) // Googleログイン済みユーザー
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthUser(session.user)
        loadMember(session.user)
      } else {
        setInitializing(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthUser(session.user)
        loadMember(session.user)
      } else {
        setAuthUser(null)
        setCurrentUser(null)
        setInitializing(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadMember(user) {
    try {
      const { data } = await supabase
        .from('members').select('*').eq('user_id', user.id).maybeSingle()
      setCurrentUser(data || null)
    } catch (e) {
      console.error(e)
    } finally {
      setInitializing(false)
    }
  }

  if (initializing) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={styles.spinner} />
        <div>読み込み中...</div>
      </div>
    )
  }

  if (currentUser && currentUser.is_active === false) {
    return (
      <div style={{ ...styles.loginPage, gap: 16 }}>
        <div style={styles.loginTitle}>🎸 SoundCity</div>
        <div style={{ fontSize: 16, color: '#e53e3e', fontWeight: 700 }}>アクセスできません</div>
        <div style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
          退部・卒業済みのためアプリを利用できません。<br />心当たりがある場合は幹部にご連絡ください。
        </div>
        <button
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14 }}
          onClick={() => supabase.auth.signOut()}
        >ログアウト</button>
      </div>
    )
  }

  const showBottomNav = currentUser && location.pathname !== '/register'
  const fallback = <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>読み込み中...</div>

  return (
    <>
      <Routes>
        <Route path="/" element={
          currentUser ? <Navigate to="/home" replace />
          : authUser ? <Navigate to="/register" replace />
          : <LoginPage />
        } />
        <Route path="/register" element={authUser ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/home" element={currentUser ? <HomePage /> : <Navigate to="/" replace />} />
        <Route path="/live-select" element={currentUser ? <LiveSelectPage /> : <Navigate to="/" replace />} />
        <Route path="/apply/a" element={currentUser ? <ApplyPageA /> : <Navigate to="/" replace />} />
        <Route path="/apply/b" element={currentUser ? <ApplyPageB /> : <Navigate to="/" replace />} />
        <Route path="/apply/confirm" element={currentUser ? <ApplyConfirmPage /> : <Navigate to="/" replace />} />
        <Route path="/applications" element={currentUser ? <ApplicationListPage /> : <Navigate to="/" replace />} />
        <Route path="/members" element={currentUser ? <MemberListPage /> : <Navigate to="/" replace />} />
        <Route path="/members/:memberId" element={currentUser ? <MemberDetailPage /> : <Navigate to="/" replace />} />
        <Route path="/profile/edit" element={currentUser ? <ProfileEditPage /> : <Navigate to="/" replace />} />
        <Route path="/templates" element={currentUser ? <TemplateListPage /> : <Navigate to="/" replace />} />
        <Route path="/contact" element={currentUser ? <ContactPage /> : <Navigate to="/" replace />} />
        <Route path="/room-reservation" element={currentUser ? <RoomReservationPage /> : <Navigate to="/" replace />} />
        <Route path="/live-videos" element={currentUser ? <LiveVideosPage /> : <Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminGuard><Suspense fallback={fallback}><AdminHomePage /></Suspense></AdminGuard>} />
        <Route path="/admin/lives" element={<AdminGuard><Suspense fallback={fallback}><LiveManagePage /></Suspense></AdminGuard>} />
        <Route path="/admin/timetable" element={<AdminGuard><Suspense fallback={fallback}><TimetablePage /></Suspense></AdminGuard>} />
        <Route path="/admin/fees" element={<AdminGuard><Suspense fallback={fallback}><FeesPage /></Suspense></AdminGuard>} />
        <Route path="/admin/members" element={<AdminGuard><Suspense fallback={fallback}><MemberManagePage /></Suspense></AdminGuard>} />
        <Route path="/admin/live-videos" element={<AdminGuard><Suspense fallback={fallback}><LiveVideosManagePage /></Suspense></AdminGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showBottomNav && <BottomNavSpacer />}
      {showBottomNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/soundcity">
      <AppRoutes />
    </BrowserRouter>
  )
}
