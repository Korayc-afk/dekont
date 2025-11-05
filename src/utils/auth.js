// Admin authentication utilities

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 dakika

export const authUtils = {
  // Session kontrolü
  isAuthenticated: () => {
    try {
      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) return false

      const sessionData = JSON.parse(adminSession)
      const now = Date.now()

      // Session timeout kontrolü
      if (now - sessionData.timestamp > SESSION_TIMEOUT) {
        localStorage.removeItem('admin_session')
        return false
      }

      return sessionData.authenticated === true
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  },

  // Session yenile
  refreshSession: () => {
    try {
      const adminSession = localStorage.getItem('admin_session')
      if (adminSession) {
        const sessionData = JSON.parse(adminSession)
        sessionData.timestamp = Date.now()
        localStorage.setItem('admin_session', JSON.stringify(sessionData))
        return true
      }
      return false
    } catch (error) {
      console.error('Session refresh error:', error)
      return false
    }
  },

  // Çıkış yap
  logout: () => {
    localStorage.removeItem('admin_session')
    window.location.href = '/yönetim-giriş-secure'
  },

  // Admin route koruması (HOC için)
  requireAuth: (navigate) => {
    if (!authUtils.isAuthenticated()) {
      navigate('/yönetim-giriş-secure', { replace: true })
      return false
    }
    return true
  }
}

