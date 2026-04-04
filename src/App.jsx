import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import liff from '@line/liff'
import { LIFF_ID } from './config.js'
import { useApp } from './context/AppContext.jsx'
import { getMembers } from './api.js'

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
import AdminHomePage from './pages/AdminHomePage.jsx'
import LiveManagePage from './pages/LiveManagePage.jsx'
import TimetablePage from './pages/TimetablePage.jsx'
import FeesPage from './pages/FeesPage.jsx'
import MemberManagePage from './pages/MemberManagePage.jsx'
import TemplateListPage from './pages/TemplateListPage.jsx'

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    color: '#555',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #eee',
    borderTop: '4px solid #06C755',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 16,
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

function AppRoutes() {
  const { currentUser, setCurrentUser, setLiff } = useApp()
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function initLiff() {
      try {
        if (LIFF_ID) {
          await liff.init({ liffId: LIFF_ID })
          setLiff(liff)
          if (!liff.isLoggedIn()) {
            liff.login()
            return
          }
          const profile = await liff.getProfile()
          const lineUid = profile.userId
          try {
            const res = await getMembers({ line_uid: lineUid })
            const members = res.members || res || []
            const found = members.find(m => m.line_uid === lineUid)
            if (found) setCurrentUser(found)
          } catch (e) {
            console.warn('Could not fetch member:', e)
          }
        } else {
          // Dev mode without LIFF_ID
          console.warn('LIFF_ID not set, running in dev mode')
          setCurrentUser({
            member_id: 'dev-001',
            line_uid: 'dev-uid',
            full_name: 'Dev User',
            is_admin: true,
            is_active: true,
          })
        }
      } catch (e) {
        console.error('LIFF init error:', e)
        setError(e.message)
      } finally {
        setInitializing(false)
      }
    }
    initLiff()
  }, [setCurrentUser, setLiff])

  if (initializing) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={styles.spinner} />
        <div>読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...styles.loading, color: '#e53e3e' }}>
        <div>初期化エラー: {error}</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser
            ? <Navigate to="/home" replace />
            : <Navigate to="/register" replace />
        }
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={currentUser ? <HomePage /> : <Navigate to="/register" replace />} />
      <Route path="/live-select" element={currentUser ? <LiveSelectPage /> : <Navigate to="/register" replace />} />
      <Route path="/apply/a" element={currentUser ? <ApplyPageA /> : <Navigate to="/register" replace />} />
      <Route path="/apply/b" element={currentUser ? <ApplyPageB /> : <Navigate to="/register" replace />} />
      <Route path="/apply/confirm" element={currentUser ? <ApplyConfirmPage /> : <Navigate to="/register" replace />} />
      <Route path="/applications" element={currentUser ? <ApplicationListPage /> : <Navigate to="/register" replace />} />
      <Route path="/members" element={currentUser ? <MemberListPage /> : <Navigate to="/register" replace />} />
      <Route path="/members/:memberId" element={currentUser ? <MemberDetailPage /> : <Navigate to="/register" replace />} />
      <Route path="/profile/edit" element={currentUser ? <ProfileEditPage /> : <Navigate to="/register" replace />} />
      <Route path="/admin" element={<AdminGuard><AdminHomePage /></AdminGuard>} />
      <Route path="/admin/lives" element={<AdminGuard><LiveManagePage /></AdminGuard>} />
      <Route path="/admin/timetable" element={<AdminGuard><TimetablePage /></AdminGuard>} />
      <Route path="/admin/fees" element={<AdminGuard><FeesPage /></AdminGuard>} />
      <Route path="/admin/members" element={<AdminGuard><MemberManagePage /></AdminGuard>} />
      <Route path="/templates" element={currentUser ? <TemplateListPage /> : <Navigate to="/register" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
