import { createContext, useContext, useEffect, useState } from 'react'
import { API } from '../data/hints.js'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch(`${API}/api/player/me`, { credentials: 'include' })
      const data = await res.json()
      setPlayer(data.player)
      setStats(data.stats)
    } catch { /* server may still be starting */ }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const logout = async () => {
    await fetch(`${API}/api/player/logout`, { method: 'POST', credentials: 'include' })
    setPlayer(null)
    setStats(null)
  }

  return (
    <PlayerContext.Provider value={{ player, stats, loading, refresh, setPlayer, setStats, logout }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
