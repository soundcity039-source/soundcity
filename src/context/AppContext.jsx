import { createContext, useContext, useState, useEffect } from 'react'
import { applyTheme, DEFAULT_THEME } from '../theme.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [formState, setFormState] = useState({
    live_id: '',
    live_name: '',
    band_name: '',
    song_count: '',
    parts: [],
    save_as_template: false,
    editing_plan_id: null,
    mic_note: '',
    sound_note: '',
    se_note: '',
    light_note: '',
  })
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('sc_theme') || DEFAULT_THEME
  })

  useEffect(() => {
    applyTheme(themeId)
  }, [themeId])

  function changeTheme(id) {
    setThemeId(id)
    localStorage.setItem('sc_theme', id)
  }

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, formState, setFormState, themeId, changeTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
