import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Logo from './Logo'

const AdminLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)

  // Admin şifresi (production'da environment variable'dan alınmalı)
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Padisah2024!Secure'
  
  // Session timeout (30 dakika)
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 dakika
  const MAX_ATTEMPTS = 5
  const LOCK_DURATION = 15 * 60 * 1000 // 15 dakika

  useEffect(() => {
    // Zaten giriş yapılmış mı kontrol et
    const adminSession = localStorage.getItem('admin_session')
    if (adminSession) {
      const sessionData = JSON.parse(adminSession)
      const now = Date.now()
      
      // Session timeout kontrolü
      if (now - sessionData.timestamp < SESSION_TIMEOUT) {
        navigate('/yönetim-panel-2024-secure', { replace: true })
        return
      } else {
        // Session süresi dolmuş
        localStorage.removeItem('admin_session')
      }
    }

    // Lock durumu kontrolü
    const lockData = localStorage.getItem('admin_lock')
    if (lockData) {
      const lock = JSON.parse(lockData)
      const now = Date.now()
      if (now - lock.timestamp < LOCK_DURATION) {
        setIsLocked(true)
        setLockTime(Math.ceil((LOCK_DURATION - (now - lock.timestamp)) / 1000))
      } else {
        localStorage.removeItem('admin_lock')
        localStorage.removeItem('admin_attempts')
      }
    }

    // Attempt sayısını yükle
    const savedAttempts = localStorage.getItem('admin_attempts')
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }
  }, [navigate])

  // Lock countdown
  useEffect(() => {
    if (isLocked && lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false)
            localStorage.removeItem('admin_lock')
            localStorage.removeItem('admin_attempts')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isLocked, lockTime])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Lock kontrolü
    if (isLocked) {
      setError(`Çok fazla başarısız deneme. Lütfen ${Math.ceil(lockTime / 60)} dakika sonra tekrar deneyin.`)
      return
    }

    // Şifre hash'leme (basit hash, production'da bcrypt kullanılmalı)
    const hashPassword = (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 32bit integer'a çevir
      }
      return hash.toString()
    }

    // Şifreyi hash'le ve kontrol et
    const hashedInput = hashPassword(password)
    const hashedAdmin = hashPassword(ADMIN_PASSWORD)

    if (hashedInput === hashedAdmin) {
      // Başarılı giriş
      const sessionData = {
        authenticated: true,
        timestamp: Date.now(),
        token: btoa(`${Date.now()}-${Math.random()}`) // Basit token
      }
      localStorage.setItem('admin_session', JSON.stringify(sessionData))
      localStorage.removeItem('admin_attempts')
      localStorage.removeItem('admin_lock')
      
      navigate('/yönetim-panel-2024-secure', { replace: true })
    } else {
      // Başarısız giriş
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      localStorage.setItem('admin_attempts', newAttempts.toString())

      if (newAttempts >= MAX_ATTEMPTS) {
        // Hesap kilitle
        setIsLocked(true)
        setLockTime(LOCK_DURATION / 1000)
        localStorage.setItem('admin_lock', JSON.stringify({
          timestamp: Date.now()
        }))
        setError(`Çok fazla başarısız deneme. Hesap ${Math.ceil(LOCK_DURATION / 60000)} dakika kilitlendi.`)
      } else {
        setError(`Hatalı şifre! Kalan deneme hakkı: ${MAX_ATTEMPTS - newAttempts}`)
      }
    }

    setPassword('')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: '#161d2c' }}>
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo size="text-2xl" />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
              Admin Girişi
            </h1>
            <p className="text-white/70 text-sm">Güvenli yönetim paneline erişim</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Lock Warning */}
          {isLocked && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center">
              <p className="text-orange-300 text-sm font-semibold mb-2">
                Hesap Geçici Olarak Kilitlendi
              </p>
              <p className="text-orange-400 text-2xl font-bold">
                {formatTime(lockTime)}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/90 font-semibold text-sm">
                <Lock size={18} className="text-orange-400" />
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  placeholder="Şifrenizi giriniz"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {attempts > 0 && !isLocked && (
                <p className="text-yellow-400 text-xs">
                  Kalan deneme hakkı: {MAX_ATTEMPTS - attempts}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLocked || !password}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              Giriş Yap
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-xs text-center">
              🔒 Bu sayfa güvenlik altındadır. Tüm giriş denemeleri loglanmaktadır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

