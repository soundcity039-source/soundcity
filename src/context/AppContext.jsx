import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [liff, setLiff] = useState(null)
  const [formState, setFormState] = useState({
    live_id: '',
    live_name: '',
    band_name: '',
    song_count: '',
    parts: [],
    save_as_template: false,
    editing_plan_id: null,
  })

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, liff, setLiff, formState, setFormState }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
